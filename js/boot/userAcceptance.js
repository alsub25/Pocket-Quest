// js/boot/userAcceptance.js
// Patch 1.2.72: early boot diagnostics + acceptance gate.

import { GAME_PATCH } from '../game/systems/version.js';
import { safeStorageGet, safeStorageSet, safeStorageRemove } from './lib/safeStorage.js';

/* --------------------------------------------------------------------------
   Boot diagnostics: capture early load errors that prevent the game from
   launching, and render a screenshot-friendly overlay.
   -------------------------------------------------------------------------- */

function _pqNowIso() {
  try { return new Date().toISOString(); } catch (_) { return String(Date.now()); }
}

export function installBootDiagnostics() {
  if (typeof window === 'undefined') return
  if (window.PQ_BOOT_DIAG && window.PQ_BOOT_DIAG.__installed) return

  const diag = (window.PQ_BOOT_DIAG = window.PQ_BOOT_DIAG || {})
  diag.__installed = true
  diag.startedAt = diag.startedAt || _pqNowIso()
  diag.errors = Array.isArray(diag.errors) ? diag.errors : []

  // Boot overlay is meant for *launch-blocking* issues.
  // We only auto-show it during a short "boot window" (or until bootstrap
  // marks the boot as successful).
  if (typeof diag.bootOk !== 'boolean') diag.bootOk = false
  if (typeof diag.bootWindowEndsAt !== 'number') diag.bootWindowEndsAt = Date.now() + 8000
  diag._overlayShown = !!diag._overlayShown

  diag.markBootOk = () => {
    try {
      diag.bootOk = true
      diag.bootWindowEndsAt = 0
    } catch (_) {}
  }

  const maybeAutoShowOverlay = () => {
    try {
      if (diag._overlayShown) return
      if (diag.bootOk) return
      if (diag.bootWindowEndsAt && Date.now() > diag.bootWindowEndsAt) return
      diag._overlayShown = true
      // Yield to let the current error flush into the report first.
      setTimeout(() => {
        try { if (diag.renderOverlay) diag.renderOverlay() } catch (_) {}
      }, 0)
    } catch (_) {}
  }

  const push = (kind, payload) => {
    try {
      diag.errors.push({
        t: _pqNowIso(),
        kind,
        ...payload
      })
      if (diag.errors.length > 80) diag.errors.splice(0, diag.errors.length - 80)

      try {
        localStorage.setItem(
          'pq-last-boot-errors',
          JSON.stringify({
            startedAt: diag.startedAt,
            url: location.href,
            ua: navigator.userAgent,
            errors: diag.errors
          })
        )
      } catch (_) {}
    } catch (_) {}

    // If something goes wrong during boot, show the overlay automatically.
    // (Runtime gameplay errors should not pop overlays in the player's face.)
    if (kind === 'error' || kind === 'unhandledrejection' || kind === 'scriptLoadError' || kind === 'preflight') {
      maybeAutoShowOverlay()
    }
  }

  window.addEventListener('error', (ev) => {
    push('error', {
      message: String(ev.message || 'Unknown error'),
      filename: ev.filename || '',
      lineno: ev.lineno || 0,
      colno: ev.colno || 0
    })
  })

  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev && ev.reason
    push('unhandledrejection', {
      message: reason && reason.message ? String(reason.message) : String(reason),
      stack: reason && reason.stack ? String(reason.stack) : ''
    })
  })

  diag.buildReport = () => ({
    startedAt: diag.startedAt,
    url: (typeof location !== 'undefined' ? location.href : ''),
    ua: (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
    errors: diag.errors
  })

  diag.renderOverlay = () => {
    try {
      const id = 'pq-boot-diag-overlay'
      if (document.getElementById(id)) return

      const overlay = document.createElement('div')
      overlay.id = id
      overlay.style.position = 'fixed'
      overlay.style.inset = '0'
      overlay.style.zIndex = '999999'
      overlay.style.background = '#1a1a1a'
      overlay.style.color = '#fff'
      overlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      overlay.style.padding = '0'
      overlay.style.overflow = 'auto'
      overlay.style.lineHeight = '1.6'
      overlay.style.WebkitFontSmoothing = 'antialiased'

      // Header section with title and subtitle
      const header = document.createElement('div')
      header.style.background = 'linear-gradient(180deg, #2d1517 0%, #1a1a1a 100%)'
      header.style.padding = '16px'
      header.style.borderBottom = '2px solid #ff4444'
      header.style.position = 'sticky'
      header.style.top = '0'
      header.style.zIndex = '1'

      const titleRow = document.createElement('div')
      titleRow.style.display = 'flex'
      titleRow.style.alignItems = 'center'
      titleRow.style.gap = '8px'
      titleRow.style.marginBottom = '8px'
      
      const icon = document.createElement('div')
      icon.style.fontSize = '28px'
      icon.textContent = '⚠️'
      
      const titleText = document.createElement('div')
      titleText.style.fontSize = '20px'
      titleText.style.fontWeight = '700'
      titleText.style.color = '#ff6b6b'
      titleText.style.letterSpacing = '-0.5px'
      titleText.textContent = `Boot Failed`
      
      const versionBadge = document.createElement('div')
      versionBadge.style.fontSize = '11px'
      versionBadge.style.padding = '2px 8px'
      versionBadge.style.background = 'rgba(255,255,255,0.1)'
      versionBadge.style.borderRadius = '12px'
      versionBadge.style.marginLeft = 'auto'
      versionBadge.textContent = `v${GAME_PATCH}`
      
      titleRow.appendChild(icon)
      titleRow.appendChild(titleText)
      titleRow.appendChild(versionBadge)
      header.appendChild(titleRow)

      const subtitle = document.createElement('div')
      subtitle.style.fontSize = '13px'
      subtitle.style.color = '#ffd93d'
      subtitle.style.lineHeight = '1.4'
      subtitle.textContent = 'The game could not start. Review error details below.'
      header.appendChild(subtitle)

      overlay.appendChild(header)

      // Action buttons - compact and mobile-friendly
      const actions = document.createElement('div')
      actions.style.padding = '12px 16px'
      actions.style.background = 'rgba(255,255,255,0.03)'
      actions.style.display = 'flex'
      actions.style.gap = '8px'
      actions.style.borderBottom = '1px solid rgba(255,255,255,0.1)'

      const mkBtn = (label, icon, isPrimary = false) => {
        const b = document.createElement('button')
        b.style.flex = isPrimary ? '1' : '0'
        b.style.padding = '10px 12px'
        b.style.cursor = 'pointer'
        b.style.border = 'none'
        b.style.borderRadius = '8px'
        b.style.fontSize = '13px'
        b.style.fontWeight = '600'
        b.style.display = 'flex'
        b.style.alignItems = 'center'
        b.style.justifyContent = 'center'
        b.style.gap = '6px'
        b.style.whiteSpace = 'nowrap'
        
        if (isPrimary) {
          b.style.background = '#4dabf7'
          b.style.color = '#000'
        } else {
          b.style.background = 'rgba(255,255,255,0.08)'
          b.style.color = '#ccc'
        }
        
        const iconSpan = document.createElement('span')
        iconSpan.textContent = icon
        iconSpan.style.fontSize = '16px'
        
        const textSpan = document.createElement('span')
        textSpan.textContent = label
        
        b.appendChild(iconSpan)
        if (label) b.appendChild(textSpan)
        
        return b
      }

      const btnCopy = mkBtn('Copy', '📋', true)
      const copyTextSpan = btnCopy.querySelector('span:last-child')
      btnCopy.addEventListener('click', async () => {
        try {
          const payload = JSON.stringify(diag.buildReport(), null, 2)
          await navigator.clipboard.writeText(payload)
          copyTextSpan.textContent = 'Copied!'
          setTimeout(() => copyTextSpan.textContent = 'Copy', 1500)
        } catch (_) {
          copyTextSpan.textContent = 'Failed'
          setTimeout(() => copyTextSpan.textContent = 'Copy', 2000)
        }
      })

      const btnClear = mkBtn('', '🗑️')
      btnClear.title = 'Clear & Close'
      btnClear.addEventListener('click', () => {
        diag.errors = []
        try { localStorage.removeItem('pq-last-boot-errors') } catch (_) {}
        overlay.remove()
      })

      const btnClose = mkBtn('', '✕')
      btnClose.title = 'Close'
      btnClose.addEventListener('click', () => overlay.remove())

      actions.appendChild(btnCopy)
      actions.appendChild(btnClear)
      actions.appendChild(btnClose)
      overlay.appendChild(actions)

      // Content area
      const content = document.createElement('div')
      content.style.padding = '16px'

      // Render human-readable errors
      const report = diag.buildReport()
      if (report.errors && report.errors.length > 0) {
        const errorsHeader = document.createElement('div')
        errorsHeader.style.fontSize = '15px'
        errorsHeader.style.fontWeight = '700'
        errorsHeader.style.marginBottom = '16px'
        errorsHeader.style.color = '#ff6b6b'
        errorsHeader.style.display = 'flex'
        errorsHeader.style.alignItems = 'center'
        errorsHeader.style.gap = '8px'
        
        const errorCount = document.createElement('span')
        errorCount.style.background = '#ff4444'
        errorCount.style.color = '#fff'
        errorCount.style.padding = '2px 8px'
        errorCount.style.borderRadius = '12px'
        errorCount.style.fontSize = '13px'
        errorCount.style.fontWeight = '700'
        errorCount.textContent = report.errors.length
        
        const errorLabel = document.createElement('span')
        errorLabel.textContent = `Error${report.errors.length > 1 ? 's' : ''} Detected`
        
        errorsHeader.appendChild(errorCount)
        errorsHeader.appendChild(errorLabel)
        content.appendChild(errorsHeader)

        report.errors.forEach((err, idx) => {
          const errorCard = document.createElement('div')
          errorCard.style.background = '#2a1616'
          errorCard.style.border = '1px solid #ff4444'
          errorCard.style.borderRadius = '12px'
          errorCard.style.marginBottom = '16px'
          errorCard.style.overflow = 'hidden'

          // Error header
          const errorHeader = document.createElement('div')
          errorHeader.style.background = 'linear-gradient(90deg, #ff4444 0%, #cc0000 100%)'
          errorHeader.style.padding = '12px 14px'
          errorHeader.style.display = 'flex'
          errorHeader.style.justifyContent = 'space-between'
          errorHeader.style.alignItems = 'center'

          const errorTitleBox = document.createElement('div')
          
          const errorNum = document.createElement('div')
          errorNum.style.fontSize = '11px'
          errorNum.style.opacity = '0.8'
          errorNum.style.marginBottom = '2px'
          errorNum.textContent = `Error #${idx + 1}`
          
          const errorTitle = document.createElement('div')
          errorTitle.style.fontSize = '16px'
          errorTitle.style.fontWeight = '700'
          errorTitle.style.color = '#fff'
          
          // Format error type with more detail
          let errorType = err.kind || 'error'
          let errorIcon = '🔴'
          if (errorType === 'scriptLoadError') {
            errorType = 'Script Load Error'
            errorIcon = '📜'
          } else if (errorType === 'unhandledrejection') {
            errorType = 'Promise Rejection'
            errorIcon = '⚡'
          } else if (errorType === 'error') {
            errorType = 'JavaScript Error'
            errorIcon = '⚠️'
          }
          errorTitle.textContent = `${errorIcon} ${errorType}`
          
          errorTitleBox.appendChild(errorNum)
          errorTitleBox.appendChild(errorTitle)
          
          const errorTime = document.createElement('div')
          errorTime.style.fontSize = '10px'
          errorTime.style.opacity = '0.7'
          errorTime.style.textAlign = 'right'
          errorTime.style.fontFamily = 'monospace'
          if (err.t) {
            const time = new Date(err.t)
            errorTime.textContent = time.toLocaleTimeString()
          }

          errorHeader.appendChild(errorTitleBox)
          errorHeader.appendChild(errorTime)
          errorCard.appendChild(errorHeader)

          // Error body with detailed info
          const errorBody = document.createElement('div')
          errorBody.style.padding = '14px'

          // Error message section - DETAILED
          if (err.message) {
            const msgSection = document.createElement('div')
            msgSection.style.marginBottom = '14px'
            
            const msgLabel = document.createElement('div')
            msgLabel.style.fontSize = '11px'
            msgLabel.style.fontWeight = '700'
            msgLabel.style.color = '#ff6b6b'
            msgLabel.style.textTransform = 'uppercase'
            msgLabel.style.letterSpacing = '0.5px'
            msgLabel.style.marginBottom = '6px'
            msgLabel.textContent = '⚠️ Error Message'
            msgSection.appendChild(msgLabel)
            
            const msgText = document.createElement('div')
            msgText.style.fontSize = '14px'
            msgText.style.background = '#000'
            msgText.style.padding = '12px'
            msgText.style.borderRadius = '6px'
            msgText.style.fontFamily = 'monospace'
            msgText.style.lineHeight = '1.5'
            msgText.style.color = '#ffcccc'
            msgText.style.border = '1px solid rgba(255,68,68,0.3)'
            msgText.style.wordBreak = 'break-word'
            msgText.style.maxHeight = '150px'
            msgText.style.overflow = 'auto'
            msgText.textContent = err.message
            msgSection.appendChild(msgText)
            
            // Add explanation if it's a script load error
            if (err.kind === 'scriptLoadError') {
              const explanation = document.createElement('div')
              explanation.style.fontSize = '12px'
              explanation.style.marginTop = '8px'
              explanation.style.padding = '8px'
              explanation.style.background = 'rgba(77,171,247,0.1)'
              explanation.style.borderRadius = '4px'
              explanation.style.color = '#9ed8ff'
              explanation.style.lineHeight = '1.5'
              
              const explainStrong = document.createElement('strong')
              explainStrong.textContent = 'What this means:'
              explanation.appendChild(explainStrong)
              explanation.appendChild(document.createTextNode(' The browser tried to load a JavaScript file but encountered a syntax error. This usually happens when the file is corrupted or from an incompatible version.'))
              
              msgSection.appendChild(explanation)
            }
            
            errorBody.appendChild(msgSection)
          }

          // File location section - ENHANCED WITH MORE INFO
          if (err.src || err.filename) {
            const locSection = document.createElement('div')
            locSection.style.marginBottom = '14px'
            
            const locLabel = document.createElement('div')
            locLabel.style.fontSize = '11px'
            locLabel.style.fontWeight = '700'
            locLabel.style.color = '#4dabf7'
            locLabel.style.textTransform = 'uppercase'
            locLabel.style.letterSpacing = '0.5px'
            locLabel.style.marginBottom = '6px'
            locLabel.textContent = '📍 File Location'
            locSection.appendChild(locLabel)
            
            const file = err.src || err.filename || 'unknown'
            const line = err.lineno
            const col = err.colno
            
            // File path
            const fileBox = document.createElement('div')
            fileBox.style.fontSize = '12px'
            fileBox.style.background = '#000'
            fileBox.style.padding = '10px'
            fileBox.style.borderRadius = '6px'
            fileBox.style.fontFamily = 'monospace'
            fileBox.style.color = '#9ed8ff'
            fileBox.style.border = '1px solid rgba(77,171,247,0.3)'
            fileBox.style.wordBreak = 'break-word'
            fileBox.style.overflowWrap = 'anywhere'
            fileBox.style.lineHeight = '1.5'
            fileBox.textContent = file
            locSection.appendChild(fileBox)
            
            // Line and column info if available
            if (line || col) {
              const posInfo = document.createElement('div')
              posInfo.style.marginTop = '8px'
              posInfo.style.fontSize = '12px'
              posInfo.style.color = '#aaa'
              posInfo.style.display = 'flex'
              posInfo.style.gap = '12px'
              
              if (line) {
                const lineInfo = document.createElement('div')
                const lineStrong = document.createElement('strong')
                lineStrong.style.color = '#4dabf7'
                lineStrong.textContent = 'Line:'
                lineInfo.appendChild(lineStrong)
                lineInfo.appendChild(document.createTextNode(' ' + line))
                posInfo.appendChild(lineInfo)
              }
              
              if (col) {
                const colInfo = document.createElement('div')
                const colStrong = document.createElement('strong')
                colStrong.style.color = '#4dabf7'
                colStrong.textContent = 'Column:'
                colInfo.appendChild(colStrong)
                colInfo.appendChild(document.createTextNode(' ' + col))
                posInfo.appendChild(colInfo)
              }
              
              locSection.appendChild(posInfo)
            }
            
            errorBody.appendChild(locSection)
          }

          // Module version info
          if (err.version) {
            const versionSection = document.createElement('div')
            versionSection.style.marginBottom = '14px'
            
            const versionLabel = document.createElement('div')
            versionLabel.style.fontSize = '11px'
            versionLabel.style.fontWeight = '700'
            versionLabel.style.color = '#ffd93d'
            versionLabel.style.textTransform = 'uppercase'
            versionLabel.style.letterSpacing = '0.5px'
            versionLabel.style.marginBottom = '6px'
            versionLabel.textContent = '📦 Module Version'
            versionSection.appendChild(versionLabel)
            
            const versionBox = document.createElement('div')
            versionBox.style.fontSize = '14px'
            versionBox.style.background = 'rgba(255,217,61,0.1)'
            versionBox.style.padding = '8px 10px'
            versionBox.style.borderRadius = '6px'
            versionBox.style.color = '#ffd93d'
            versionBox.style.fontFamily = 'monospace'
            versionBox.textContent = err.version
            versionSection.appendChild(versionBox)
            
            errorBody.appendChild(versionSection)
          }

          // Browser and system info
          const sysSection = document.createElement('div')
          sysSection.style.marginBottom = '14px'
          sysSection.style.fontSize = '11px'
          sysSection.style.padding = '10px'
          sysSection.style.background = 'rgba(255,255,255,0.03)'
          sysSection.style.borderRadius = '6px'
          sysSection.style.color = '#888'
          sysSection.style.lineHeight = '1.6'
          
          const ua = report.ua || navigator.userAgent || 'Unknown'
          // Browser detection - order matters as Chrome includes 'Safari' in UA
          const browser = ua.includes('Chrome') ? '🌐 Chrome' :
                         ua.includes('Firefox') ? '🦊 Firefox' :
                         ua.includes('Safari') ? '🧭 Safari' : '🌐 Browser'
          
          const isMobile = /iPhone|iPad|iPod|Android/i.test(ua)
          const device = isMobile ? '📱 Mobile' : '💻 Desktop'
          
          // Environment row
          const envRow = document.createElement('div')
          envRow.style.marginBottom = '4px'
          const envStrong = document.createElement('strong')
          envStrong.style.color = '#aaa'
          envStrong.textContent = 'Environment:'
          envRow.appendChild(envStrong)
          envRow.appendChild(document.createTextNode(' ' + browser + ' • ' + device))
          sysSection.appendChild(envRow)
          
          // URL row
          const urlRow = document.createElement('div')
          urlRow.style.marginBottom = '4px'
          const urlStrong = document.createElement('strong')
          urlStrong.style.color = '#aaa'
          urlStrong.textContent = 'URL:'
          urlRow.appendChild(urlStrong)
          urlRow.appendChild(document.createTextNode(' '))
          const urlSpan = document.createElement('span')
          urlSpan.style.fontFamily = 'monospace'
          urlSpan.style.fontSize = '10px'
          urlSpan.textContent = report.url || location.href
          urlRow.appendChild(urlSpan)
          sysSection.appendChild(urlRow)
          
          // Time row
          const timeRow = document.createElement('div')
          const timeStrong = document.createElement('strong')
          timeStrong.style.color = '#aaa'
          timeStrong.textContent = 'Time:'
          timeRow.appendChild(timeStrong)
          timeRow.appendChild(document.createTextNode(' ' + (err.t || 'N/A')))
          sysSection.appendChild(timeRow)
          
          errorBody.appendChild(sysSection)

          // DETAILED troubleshooting help
          const helpSection = document.createElement('div')
          helpSection.style.marginTop = '14px'
          helpSection.style.padding = '12px'
          helpSection.style.background = 'linear-gradient(135deg, rgba(77,171,247,0.15) 0%, rgba(77,171,247,0.05) 100%)'
          helpSection.style.borderRadius = '8px'
          helpSection.style.border = '1px solid rgba(77,171,247,0.3)'
          
          const helpTitle = document.createElement('div')
          helpTitle.style.fontSize = '13px'
          helpTitle.style.fontWeight = '700'
          helpTitle.style.color = '#4dabf7'
          helpTitle.style.marginBottom = '10px'
          helpTitle.style.display = 'flex'
          helpTitle.style.alignItems = 'center'
          helpTitle.style.gap = '6px'
          
          const helpIcon = document.createElement('span')
          helpIcon.textContent = '💡'
          helpIcon.style.fontSize = '16px'
          
          const helpTitleText = document.createElement('span')
          helpTitleText.textContent = 'How to Fix This Error'
          
          helpTitle.appendChild(helpIcon)
          helpTitle.appendChild(helpTitleText)
          helpSection.appendChild(helpTitle)
          
          let steps = []
          let explanation = ''
          
          if (err.kind === 'scriptLoadError') {
            explanation = 'This error occurs when the browser cannot properly load or parse a JavaScript file.'
            steps = [
              {
                title: 'Hard Refresh (Most Common Fix)',
                desc: 'Press Ctrl+Shift+R (Cmd+Shift+R on Mac) to force reload without cache',
                priority: 'high'
              },
              {
                title: 'Clear Browser Cache',
                desc: 'Go to browser settings → Clear browsing data → Cached files',
                priority: 'high'
              },
              {
                title: 'Check Network Connection',
                desc: 'Ensure stable internet connection and try reloading',
                priority: 'medium'
              },
              {
                title: 'Disable Browser Extensions',
                desc: 'Some extensions can interfere with script loading',
                priority: 'medium'
              },
              {
                title: 'Try Different Browser',
                desc: 'Test if issue persists in Chrome, Safari, or Firefox',
                priority: 'low'
              }
            ]
          } else if (err.kind === 'unhandledrejection') {
            explanation = 'This error indicates a failed asynchronous operation (Promise).'
            steps = [
              {
                title: 'Refresh the Page',
                desc: 'The issue may be temporary due to network or timing',
                priority: 'high'
              },
              {
                title: 'Check Network',
                desc: 'Ensure no network requests are being blocked',
                priority: 'high'
              },
              {
                title: 'Clear Cache',
                desc: 'Old cached data might be causing conflicts',
                priority: 'medium'
              }
            ]
          } else {
            explanation = 'This is a general JavaScript error that prevented the game from starting.'
            steps = [
              {
                title: 'Hard Refresh',
                desc: 'Press Ctrl+Shift+R (Cmd+Shift+R on Mac)',
                priority: 'high'
              },
              {
                title: 'Clear Cache',
                desc: 'Remove cached game files through browser settings',
                priority: 'high'
              },
              {
                title: 'Check Console',
                desc: 'Press F12 to view browser console for more details',
                priority: 'medium'
              }
            ]
          }
          
          if (explanation) {
            const explainBox = document.createElement('div')
            explainBox.style.fontSize = '12px'
            explainBox.style.color = '#9ed8ff'
            explainBox.style.marginBottom = '12px'
            explainBox.style.lineHeight = '1.5'
            explainBox.textContent = explanation
            helpSection.appendChild(explainBox)
          }
          
          steps.forEach((step, stepIdx) => {
            const stepBox = document.createElement('div')
            stepBox.style.marginBottom = '10px'
            stepBox.style.padding = '10px'
            stepBox.style.background = step.priority === 'high' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'
            stepBox.style.borderRadius = '6px'
            stepBox.style.borderLeft = step.priority === 'high' ? '3px solid #4dabf7' : '3px solid rgba(77,171,247,0.3)'
            
            const stepHeader = document.createElement('div')
            stepHeader.style.fontSize = '13px'
            stepHeader.style.fontWeight = '600'
            stepHeader.style.color = '#fff'
            stepHeader.style.marginBottom = '4px'
            stepHeader.style.display = 'flex'
            stepHeader.style.alignItems = 'center'
            stepHeader.style.gap = '6px'
            
            const stepNum = document.createElement('span')
            stepNum.style.background = step.priority === 'high' ? '#4dabf7' : 'rgba(77,171,247,0.3)'
            stepNum.style.color = step.priority === 'high' ? '#000' : '#fff'
            stepNum.style.width = '20px'
            stepNum.style.height = '20px'
            stepNum.style.borderRadius = '50%'
            stepNum.style.display = 'inline-flex'
            stepNum.style.alignItems = 'center'
            stepNum.style.justifyContent = 'center'
            stepNum.style.fontSize = '11px'
            stepNum.style.fontWeight = '700'
            stepNum.textContent = stepIdx + 1
            
            const stepTitle = document.createElement('span')
            stepTitle.textContent = step.title
            
            stepHeader.appendChild(stepNum)
            stepHeader.appendChild(stepTitle)
            
            const stepDesc = document.createElement('div')
            stepDesc.style.fontSize = '12px'
            stepDesc.style.color = '#aaa'
            stepDesc.style.lineHeight = '1.4'
            stepDesc.style.marginLeft = '26px'
            stepDesc.textContent = step.desc
            
            stepBox.appendChild(stepHeader)
            stepBox.appendChild(stepDesc)
            helpSection.appendChild(stepBox)
          })
          
          errorBody.appendChild(helpSection)
          errorCard.appendChild(errorBody)
          content.appendChild(errorCard)
        })
      }

      overlay.appendChild(content)

      // Technical details section - collapsed by default
      const techSection = document.createElement('details')
      techSection.style.marginTop = '16px'
      techSection.style.padding = '0'
      techSection.style.border = '1px solid rgba(255,255,255,0.1)'
      techSection.style.borderRadius = '8px'
      techSection.style.overflow = 'hidden'
      
      const techSummary = document.createElement('summary')
      techSummary.style.padding = '12px 14px'
      techSummary.style.cursor = 'pointer'
      techSummary.style.fontSize = '13px'
      techSummary.style.fontWeight = '600'
      techSummary.style.background = 'rgba(255,255,255,0.03)'
      techSummary.style.display = 'flex'
      techSummary.style.alignItems = 'center'
      techSummary.style.gap = '8px'
      techSummary.style.userSelect = 'none'
      
      const techIcon = document.createElement('span')
      techIcon.textContent = '🔍'
      
      const techTitle = document.createElement('span')
      techTitle.textContent = 'Technical Details (for developers)'
      
      techSummary.appendChild(techIcon)
      techSummary.appendChild(techTitle)
      techSection.appendChild(techSummary)
      
      const techContent = document.createElement('div')
      techContent.style.padding = '14px'
      techContent.style.background = '#0a0a0a'
      
      const techPre = document.createElement('pre')
      techPre.style.whiteSpace = 'pre-wrap'
      techPre.style.fontSize = '11px'
      techPre.style.fontFamily = '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
      techPre.style.color = '#00ff00'
      techPre.style.background = '#000'
      techPre.style.padding = '12px'
      techPre.style.borderRadius = '4px'
      techPre.style.overflow = 'auto'
      techPre.style.maxHeight = '300px'
      techPre.style.lineHeight = '1.4'
      techPre.style.border = '1px solid #333'
      techPre.textContent = JSON.stringify(report, null, 2)
      
      techContent.appendChild(techPre)
      
      const copyTechBtn = document.createElement('button')
      copyTechBtn.textContent = '📋 Copy Technical Data'
      copyTechBtn.style.marginTop = '10px'
      copyTechBtn.style.width = '100%'
      copyTechBtn.style.padding = '10px'
      copyTechBtn.style.background = 'rgba(77,171,247,0.2)'
      copyTechBtn.style.color = '#4dabf7'
      copyTechBtn.style.border = '1px solid rgba(77,171,247,0.3)'
      copyTechBtn.style.borderRadius = '6px'
      copyTechBtn.style.cursor = 'pointer'
      copyTechBtn.style.fontSize = '13px'
      copyTechBtn.style.fontWeight = '600'
      
      copyTechBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
          copyTechBtn.textContent = '✓ Copied!'
          setTimeout(() => copyTechBtn.textContent = '📋 Copy Technical Data', 1500)
        } catch (_) {
          copyTechBtn.textContent = '✗ Copy Failed'
          setTimeout(() => copyTechBtn.textContent = '📋 Copy Technical Data', 2000)
        }
      })
      
      techContent.appendChild(copyTechBtn)
      techSection.appendChild(techContent)
      content.appendChild(techSection)

      document.body.appendChild(overlay)
    } catch (_) {}
  }

  // Convenience: expose for quick console access.
  try {
    window.PQ_BOOT_DIAG.show = diag.renderOverlay
    window.PQ_BOOT_DIAG.report = diag.buildReport
  } catch (_) {}
}

// Install as early as possible.
installBootDiagnostics()



/* ==========================================================================
   userAcceptance.js  (2 SEPARATE PANELS + SCROLL-TO-BOTTOM UNLOCK PER PANEL)
   --------------------------------------------------------------------------
   - Blocks play until the user accepts BOTH:
       (1) User Acceptance Terms
       (2) Legal Notice
   - Each panel has its OWN scroll box + its OWN checkbox directly under it.
   - Each checkbox is DISABLED until its panel is scrolled to the bottom.

   Reuses existing #modal UI.

   Requires existing DOM nodes:
     #modal, #modalTitle, #modalBody, #modalClose

   Buttons it gates:
     #btnNewGame, #btnLoadGame, #btnStartGame

   Install:
     <script type="module" src="userAcceptance.js"></script>
     <script type="module" src="bootstrap.js"></script>

   To force re-accept after changing terms:
     - bump ACCEPTANCE_VERSION
   ========================================================================== */

const ACCEPTANCE_STORAGE_KEY = "pq_user_acceptance_v5";
const ACCEPTANCE_VERSION = "5.0.0";

const GATED_BUTTON_IDS = ["btnNewGame", "btnLoadGame", "btnStartGame"];

let acceptanceLockActive = false;
let installed = false;

function safeJsonParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function readAcceptanceRecord() {
  try {
    const raw = safeStorageGet(ACCEPTANCE_STORAGE_KEY);
    if (!raw) return null;
    return safeJsonParse(raw);
  } catch {
    return null;
  }
}

function writeAcceptanceRecord() {
  const rec = {
    version: ACCEPTANCE_VERSION,
    acceptedAt: Date.now(),
    acceptedTerms: true,
    acceptedLegal: true
  };
  try {
    safeStorageSet(ACCEPTANCE_STORAGE_KEY, JSON.stringify(rec));
  } catch {
    // If storage fails, acceptance is session-only after clicking Accept.
  }
}

export function hasUserAccepted() {
  const rec = readAcceptanceRecord();
  return !!(
    rec &&
    rec.version === ACCEPTANCE_VERSION &&
    typeof rec.acceptedAt === "number" &&
    rec.acceptedTerms === true &&
    rec.acceptedLegal === true
  );
}

export function resetUserAcceptance() {
  safeStorageRemove(ACCEPTANCE_STORAGE_KEY);
}

export function initUserAcceptanceGate(options = {}) {
  if (installed) return;
  installed = true;

  const {
    title = "User Acceptance Required",
    termsPanelTitle = "User Acceptance Terms",
    legalPanelTitle = "Legal Notice",
    checkbox1Label = "I have read and agree to the User Acceptance Terms.",
    checkbox2Label = "I have read and agree to the Legal Notice.",
    acceptButtonText = "I Agree — Continue",
    declineButtonText = "Exit"
  } = options;

  document.addEventListener("DOMContentLoaded", () => {
    installGameplayGateCapture();
    installModalLockCaptureHandlers();

    if (!hasUserAccepted()) {
      showAcceptanceModal({
        title,
        termsPanelTitle,
        legalPanelTitle,
        checkbox1Label,
        checkbox2Label,
        acceptButtonText,
        declineButtonText
      });
    }
  });
}

function getModalEls() {
  const modalEl = document.getElementById("modal");
  const modalTitleEl = document.getElementById("modalTitle");
  const modalBodyEl = document.getElementById("modalBody");
  const modalCloseEl = document.getElementById("modalClose");
  if (!modalEl || !modalTitleEl || !modalBodyEl || !modalCloseEl) return null;
  return { modalEl, modalTitleEl, modalBodyEl, modalCloseEl };
}

function openModalLikeGameDoes(title, builderFn) {
  const els = getModalEls();
  if (!els) return;

  const { modalEl, modalTitleEl, modalBodyEl } = els;

  // Claim and lock the modal so other UI code (bootstrap/game) can't dismiss it.
  try {
    modalEl.dataset.owner = "acceptance";
    modalEl.dataset.lock = "1";
  } catch (_) {}

  modalTitleEl.textContent = title;

  // cleanup any leftovers your game may append
  const strayFooters = modalEl.querySelectorAll(".tavern-footer-actions");
  strayFooters.forEach((el) => el.remove());

  modalBodyEl.className = "";
  modalBodyEl.innerHTML = "";
  builderFn(modalBodyEl);

  modalEl.classList.remove("hidden");
}

function closeModalLikeGameDoes() {
  const els = getModalEls();
  if (!els) return;
  const { modalEl, modalCloseEl } = els;
  modalEl.classList.add("hidden");
  modalCloseEl.style.display = "";

  // Release lock/ownership.
  try {
    if (modalEl.dataset.owner === "acceptance") modalEl.dataset.owner = "";
    if (modalEl.dataset.lock === "1") modalEl.dataset.lock = "0";
  } catch (_) {}
}

function installGameplayGateCapture() {
  document.addEventListener(
    "click",
    (e) => {
      if (hasUserAccepted()) return;

      const btn = e.target?.closest?.("button");
      if (!btn) return;
      if (!GATED_BUTTON_IDS.includes(btn.id)) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      showAcceptanceModal({
        title: "User Acceptance Required",
        termsPanelTitle: "User Acceptance Terms",
        legalPanelTitle: "Legal Notice",
        checkbox1Label: "I have read and agree to the User Acceptance Terms.",
        checkbox2Label: "I have read and agree to the Legal Notice.",
        acceptButtonText: "I Agree — Continue",
        declineButtonText: "Exit"
      });
    },
    true
  );
}

function installModalLockCaptureHandlers() {
  const els = getModalEls();
  if (!els) return;

  const { modalEl, modalCloseEl } = els;

  // Block ✕ while locked
  modalCloseEl.addEventListener(
    "click",
    (e) => {
      if (!acceptanceLockActive) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true
  );

  // Block overlay click while locked
  modalEl.addEventListener(
    "click",
    (e) => {
      if (!acceptanceLockActive) return;
      if (e.target === modalEl) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );

  // Block ESC while locked
  document.addEventListener(
    "keydown",
    (e) => {
      if (!acceptanceLockActive) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );
}

function showAcceptanceModal({
  title,
  termsPanelTitle,
  legalPanelTitle,
  checkbox1Label,
  checkbox2Label,
  acceptButtonText,
  declineButtonText
}) {
  const els = getModalEls();
  if (!els) return;

  const { modalCloseEl } = els;
  acceptanceLockActive = true;
  modalCloseEl.style.display = "none";

  openModalLikeGameDoes(title, (body) => {
    const intro = document.createElement("p");
    intro.className = "modal-subtitle";
    intro.innerHTML =
      "You must accept <strong>both</strong> documents below before playing. Each checkbox unlocks only after you scroll that document to the bottom.";
    body.appendChild(intro);

    // ----- Panel 1: Terms (panel + checkbox directly under it)
    const termsBlock = buildPanelBlock({
      panelKey: "terms",
      panelTitle: termsPanelTitle,
      noteText: "Scroll to the bottom to unlock this checkbox.",
      scrollInnerHtml: buildTermsHtml()
    });
    body.appendChild(termsBlock.block);

    const cb1 = buildAcceptanceCheckboxRow({
      id: "pqAcceptTerms",
      labelText: checkbox1Label,
      lockedTitle: "Scroll the User Acceptance Terms to the bottom to unlock.",
      initiallyDisabled: true
    });
    body.appendChild(cb1.row);

    // spacing
    const spacer = document.createElement("div");
    spacer.style.height = "10px";
    body.appendChild(spacer);

    // ----- Panel 2: Legal (panel + checkbox directly under it)
    const legalBlock = buildPanelBlock({
      panelKey: "legal",
      panelTitle: legalPanelTitle,
      noteText: "Scroll to the bottom to unlock this checkbox.",
      scrollInnerHtml: buildLegalHtml()
    });
    body.appendChild(legalBlock.block);

    const cb2 = buildAcceptanceCheckboxRow({
      id: "pqAcceptLegal",
      labelText: checkbox2Label,
      lockedTitle: "Scroll the Legal Notice to the bottom to unlock.",
      initiallyDisabled: true
    });
    body.appendChild(cb2.row);

    // ----- Actions
    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.style.marginTop = "12px";

    const btnAccept = document.createElement("button");
    btnAccept.className = "btn outline";
    btnAccept.textContent = acceptButtonText;
    btnAccept.disabled = true;

    const btnDecline = document.createElement("button");
    btnDecline.className = "btn outline";
    btnDecline.textContent = declineButtonText;

    function refreshAcceptEnabled() {
      btnAccept.disabled = !(cb1.checkbox.checked && cb2.checkbox.checked);
    }

    cb1.checkbox.addEventListener("change", refreshAcceptEnabled);
    cb2.checkbox.addEventListener("change", refreshAcceptEnabled);

    btnAccept.addEventListener("click", () => {
      if (btnAccept.disabled) return;
      writeAcceptanceRecord();
      acceptanceLockActive = false;
      closeModalLikeGameDoes();
    });

    btnDecline.addEventListener("click", () => {
      acceptanceLockActive = false;
      closeModalLikeGameDoes();
    });

    actions.appendChild(btnAccept);
    actions.appendChild(btnDecline);
    body.appendChild(actions);

    const hint = document.createElement("p");
    hint.className = "modal-subtitle";
    hint.style.marginTop = "8px";
    hint.textContent =
      "If you exit without accepting, gameplay remains locked; starting again will reopen this prompt.";
    body.appendChild(hint);

    // ----- Scroll-to-bottom unlock wiring (each checkbox tied to its own scrollbox)
    wireScrollUnlock({
      boxEl: termsBlock.scrollBox,
      detailsEl: termsBlock.details,
      checkboxEl: cb1.checkbox
    });

    wireScrollUnlock({
      boxEl: legalBlock.scrollBox,
      detailsEl: legalBlock.details,
      checkboxEl: cb2.checkbox
    });

    // If a panel’s content fits with no scrolling, unlock immediately
    requestAnimationFrame(() => {
      forceUnlockIfNoScroll(termsBlock.scrollBox, cb1.checkbox);
      forceUnlockIfNoScroll(legalBlock.scrollBox, cb2.checkbox);
    });

    window.addEventListener("resize", () => {
      forceUnlockIfNoScroll(termsBlock.scrollBox, cb1.checkbox);
      forceUnlockIfNoScroll(legalBlock.scrollBox, cb2.checkbox);
    });
  });
}

function buildPanelBlock({ panelKey, panelTitle, noteText, scrollInnerHtml }) {
  const commonTextStyle =
    "margin-top:8px; color: var(--muted); font-size: 0.85rem; line-height: 1.35;";
  const scrollBoxStyle =
    "max-height: 220px; overflow: auto; padding: 10px; border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; background: rgba(0,0,0,0.12);";
  const noteStyle =
    "margin-top:8px; color: var(--muted); font-size: 0.78rem; line-height: 1.25; opacity: 0.95;";

  const block = document.createElement("div");
  block.className = "item-row";
  block.style.marginTop = "10px";

  const details = document.createElement("details");
  details.open = true;
  details.dataset.pqDetails = panelKey;

  const summary = document.createElement("summary");
  const strong = document.createElement("strong");
  strong.textContent = panelTitle;
  summary.appendChild(strong);
  details.appendChild(summary);

  const note = document.createElement("div");
  note.style.cssText = noteStyle;
  note.textContent = noteText;
  details.appendChild(note);

  const scrollBox = document.createElement("div");
  scrollBox.dataset.pqScrollbox = panelKey;
  scrollBox.style.cssText = scrollBoxStyle;

  const inner = document.createElement("div");
  inner.style.cssText = commonTextStyle;
  inner.innerHTML = scrollInnerHtml;

  scrollBox.appendChild(inner);
  details.appendChild(scrollBox);

  block.appendChild(details);

  return { block, details, scrollBox };
}

function buildAcceptanceCheckboxRow({ id, labelText, lockedTitle, initiallyDisabled }) {
  const row = document.createElement("div");
  row.className = "item-row";
  row.style.marginTop = "8px";

  const label = document.createElement("label");
  label.style.display = "flex";
  label.style.gap = "10px";
  label.style.alignItems = "flex-start";
  label.style.cursor = "pointer";
  label.title = lockedTitle;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = id;
  checkbox.disabled = !!initiallyDisabled;

  const text = document.createElement("div");
  text.style.fontSize = "0.85rem";
  text.style.color = "var(--text)";
  text.textContent = labelText;

  label.appendChild(checkbox);
  label.appendChild(text);
  row.appendChild(label);

  // When unlocked, remove the tooltip so it doesn't feel “stuck”
  checkbox.addEventListener("change", () => { /* noop */ });

  return { row, checkbox, label };
}

function wireScrollUnlock({ boxEl, detailsEl, checkboxEl }) {
  if (!boxEl || !checkboxEl) return;

  let unlocked = false;

  const isAtBottom = () => {
    const epsilon = 2;
    return boxEl.scrollTop + boxEl.clientHeight >= boxEl.scrollHeight - epsilon;
  };

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    checkboxEl.disabled = false;

    // remove tooltip from the parent label if present
    const label = checkboxEl.closest("label");
    if (label) label.title = "";
  };

  const checkAndUnlock = () => {
    if (unlocked) return;

    // If content fits, unlock immediately
    if (boxEl.scrollHeight <= boxEl.clientHeight + 2) {
      unlock();
      return;
    }

    if (isAtBottom()) unlock();
  };

  boxEl.addEventListener("scroll", checkAndUnlock, { passive: true });

  // Details toggle can change layout/scrollHeight
  if (detailsEl) {
    detailsEl.addEventListener("toggle", () => {
      setTimeout(checkAndUnlock, 0);
    });
  }

  setTimeout(checkAndUnlock, 0);
}

function forceUnlockIfNoScroll(boxEl, checkboxEl) {
  if (!boxEl || !checkboxEl) return;
  if (!checkboxEl.disabled) return;
  const epsilon = 2;
  if (boxEl.scrollHeight <= boxEl.clientHeight + epsilon) {
    checkboxEl.disabled = false;
    const label = checkboxEl.closest("label");
    if (label) label.title = "";
  }
}

function buildTermsHtml() {
  // Generic strict terms (not legal advice). Keep as HTML string.
  return `
    <p><strong>Effective & Binding Agreement.</strong> By accepting, you enter into a binding agreement with the Creator. If you do not agree to every provision, do not use the Game.</p>

    <p><strong>1) Definitions.</strong></p>
    <ul>
      <li><strong>“Game”</strong> includes all software, code, UI, content, assets, save systems, updates, patches, and any related services/features.</li>
      <li><strong>“Content”</strong> includes text, art, audio, animations, items, characters, balance values, mechanics, and documentation.</li>
      <li><strong>“Creator”</strong> includes the author(s)/publisher(s) and any permitted contributors/licensors.</li>
      <li><strong>“Device”</strong> includes your computer/phone/tablet/browser profile and its storage.</li>
    </ul>

    <p><strong>2) Eligibility & Authority.</strong> You represent that you can form a legally binding agreement where you live, and if accepting for an entity, you have authority to bind it.</p>

    <p><strong>3) License Grant (Limited).</strong> Subject to compliance, you receive a limited, revocable, non-exclusive, non-transferable license to run the Game for personal, non-commercial entertainment. No ownership transfers.</p>

    <p><strong>4) Prototype Status / Volatility.</strong> The Game may be experimental and incomplete. Features may change or be removed; mechanics may be rebalanced; saves may become incompatible; and access may be discontinued without notice.</p>

    <p><strong>5) Saves, Storage, and Reliability (Strict).</strong></p>
    <ul>
      <li>Saves/settings may be stored locally (e.g., localStorage). The Creator may be unable to restore data for any reason.</li>
      <li>Clearing site data, browser resets, private mode, extensions, security tools, OS cleanup, quota limits, and updates can delete/corrupt saves.</li>
      <li>You are solely responsible for any backups (if feasible) and for securing your Device.</li>
    </ul>

    <p><strong>6) Conduct & Restrictions (Zero-Tolerance).</strong> You agree you will not:</p>
    <ul>
      <li>Bypass, disable, or undermine gating systems, cooldowns, fairness constraints, integrity checks, or other protections.</li>
      <li>Reverse engineer, decompile, disassemble, or attempt to extract proprietary logic except where a non-waivable law permits it.</li>
      <li>Use scripts/bots/automation to gain unfair advantage or to stress/disrupt the Game.</li>
      <li>Inject malicious code, tamper with local storage to crash/cheat, or exfiltrate data from any part of the Game.</li>
      <li>Use the Game to harass, threaten, impersonate, or encourage harmful/illegal activity.</li>
    </ul>

    <p><strong>7) Safety & Health.</strong> The Game may include flashing visuals, rapid animations, high contrast, or repetitive motion. Stop immediately if you feel discomfort (dizziness, nausea, headaches, seizures, eye strain). Do not play when alertness is required.</p>

    <p><strong>8) No Support Obligation.</strong> The Creator has no obligation to provide support, maintenance, compatibility fixes, or restore lost progress. Any support is voluntary and may stop at any time.</p>

    <p><strong>9) Feedback License.</strong> If you submit ideas/bug reports/suggestions, you grant the Creator a perpetual, worldwide, royalty-free right to use, modify, publish, and incorporate them without compensation or attribution (unless required by law).</p>

    <p><strong>10) Changes & Re-Acceptance.</strong> Terms may change. The Game may require re-acceptance before continued use. Continued use after updates constitutes acceptance.</p>

    <p><strong>11) Termination.</strong> Permission to use the Game ends immediately upon any breach. You must stop using the Game and delete unauthorized copies/derivatives.</p>

    <p><strong>12) Disclaimer of Warranties (Maximum).</strong> THE GAME IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, ALL WARRANTIES ARE DISCLAIMED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.</p>

    <p><strong>13) Assumption of Risk.</strong> You accept that gameplay outcomes, randomness, balance, and progression are not guaranteed; content may be inaccurate; and the Game may fail without warning. You proceed anyway.</p>
  `;
}

function buildLegalHtml() {
  // Generic strict legal notice (not legal advice). Keep as HTML string.
  return `
    <p><strong>Scope.</strong> This notice covers intellectual property, liability limits, indemnity, third-party materials, and related legal concepts applying to the Game and Content.</p>

    <p><strong>1) Ownership & Intellectual Property.</strong></p>
    <ul>
      <li>All right, title, and interest in the Game and Content remain with the Creator and/or licensors.</li>
      <li>The Game is licensed, not sold. No ownership rights transfer to you.</li>
      <li>You must not remove or obscure copyright, trademark, attribution, or proprietary notices.</li>
    </ul>

    <p><strong>2) Copying / Distribution / Commercial Restrictions.</strong></p>
    <ul>
      <li>You may not sell, resell, sublicense, distribute, publish, publicly perform/display, or commercially exploit the Game or Content without explicit written permission.</li>
      <li>You may not bundle the Game into another product, launcher, paid service, or monetized pack without permission.</li>
      <li>You may not redistribute raw assets (art/audio/fonts) or extracted asset packs.</li>
    </ul>

    <p><strong>3) Streaming / Recording.</strong> Unless separate guidelines exist, personal streaming/recording may be permitted for non-commercial sharing if you do not misrepresent ownership, do not distribute raw assets, and comply with platform rules and applicable law. Permission may be revoked in cases of abuse or misrepresentation.</p>

    <p><strong>4) Third-Party Materials & Licenses.</strong></p>
    <ul>
      <li>Third-party trademarks and names (if any) belong to their owners and do not imply endorsement.</li>
      <li>Third-party libraries/fonts/assets may be governed by separate licenses; you are responsible for compliance where applicable.</li>
    </ul>

    <p><strong>5) Privacy / Data Handling (General).</strong></p>
    <ul>
      <li>The Game may store saves/settings locally on your Device.</li>
      <li>If online features/telemetry/accounts/analytics are added later, additional notices/consents may be required.</li>
      <li>Anyone with access to your device/browser profile may access local saves. You are responsible for device security.</li>
    </ul>

    <p><strong>6) Security & Integrity.</strong> You agree not to attempt unauthorized access, tamper with storage, exploit vulnerabilities, or create/share tools that facilitate cheating, exploitation, disruption, or unauthorized copying.</p>

    <p><strong>7) Indemnity.</strong> To the maximum extent permitted by law, you agree to defend, indemnify, and hold harmless the Creator from claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of: (a) your misuse of the Game, (b) your violation of these documents, or (c) your violation of law or third-party rights.</p>

    <p><strong>8) Limitation of Liability (Broad).</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
    <ul>
      <li>The Creator is not liable for indirect, incidental, special, consequential, exemplary, or punitive damages.</li>
      <li>The Creator is not liable for loss of data/saves, loss of profits, device issues, downtime, or content inaccuracies.</li>
      <li>If liability cannot be excluded, it is limited to the maximum extent permitted by law and may be capped at the amount you paid (if any), where such a cap is allowed.</li>
    </ul>

    <p><strong>9) Governing Law / Venue.</strong> Disputes are governed by applicable law as required in your jurisdiction. Where allowed, disputes must be brought in an appropriate venue under that governing law. (Customize if you need a specific jurisdiction clause.)</p>

    <p><strong>10) Severability & Entire Agreement.</strong> If any provision is unenforceable, the remainder remains effective. These documents form the entire agreement regarding access to the Game unless superseded by a written agreement.</p>

    <p><strong>11) Notice & Contact.</strong> If the Game provides an official contact method, that is the channel for notices. If none is provided, response is not guaranteed.</p>
  `;
}

// Auto-init
initUserAcceptanceGate();

// Optional debug helpers
if (typeof window !== "undefined") {
  window.PQ_ACCEPT = { hasUserAccepted, resetUserAcceptance };
}
