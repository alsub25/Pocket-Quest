/* Quest definitions live here so you can add/remove quests without touching the core game loop. */

export const QUEST_DEFS = {
    main: {
        id: 'main',
        name: 'Shadows over Emberwood',
        steps: {
            0: 'Speak with Elder Rowan in Emberwood Village.',
            1: 'Travel to Emberwood Forest and defeat the Goblin Warlord.',
            2: 'Travel to the Ruined Spire and defeat the Void-Touched Dragon.',
            3: 'Enter the Ashen Marsh and end the Marsh Witch.',
            4: 'Cross Frostpeak Pass and topple the Frostpeak Giant.',
            5: 'Descend into the Sunken Catacombs and destroy the Sunken Lich.',
            6: 'Storm the Obsidian Keep and defeat the Obsidian King.',
            7: 'Return to Elder Rowan with proof the corruption is broken.',

            // Chapter II — The Blackbark Oath
            8: 'Return to Elder Rowan. Ask what your victory awakened.',
            9: 'Visit the tavern and speak with the Bark‑Scribe.',
            10: 'Recover three Oath‑Splinters: Sap‑Run (Forest), Witch‑Reed (Marsh), Bone‑Char (Catacombs).',
            11: 'Bring the splinters back to Emberwood. Undergo the Quiet Roots Trial.',
            12: 'Seek the Ash‑Warden in the depths. Make peace or make war.',
            13: 'Find the Blackbark Gate at dusk in Emberwood Forest.',
            14: 'Swear, break, or rewrite the Blackbark Oath.'
        }
    },

    side: {
        grainWhispers: {
            name: 'Whispers in the Grain',
            steps: {
                0: 'Investigate the missing stores. Ask around the tavern.',
                1: 'Search the village outskirts for the cause.',
                2: 'Return with proof and settle the matter.'
            }
        },
        missingRunner: {
            name: 'The Missing Runner',
            steps: {
                0: 'Take the note-board request in the tavern.',
                1: 'Search the forest roads for a satchel or tracks.',
                2: 'Return to the village with what you find.'
            }
        },
        barkThatBleeds: {
            name: 'Bark That Bleeds',
            steps: {
                0: 'Accept the Bark‑Scribe’s request.',
                1: 'Cut a sample from a blackened tree in Emberwood Forest.',
                2: 'Bring the sap back to the Bark‑Scribe.'
            }
        },
        debtOfTheHearth: {
            name: 'Debt of the Hearth',
            steps: {
                0: 'A family needs coin. Decide whether to help.',
                1: 'Raise the money and bring it to the village.',
                2: 'Return with your decision.'
            }
        },
        frostpeaksHymn: {
            name: 'Frostpeak’s Lost Hymn',
            steps: {
                0: 'A singer seeks a lost verse.',
                1: 'Travel through Frostpeak and recover the hymn fragment.',
                2: 'Return the verse to the tavern.'
            }
        },
        witchsApology: {
            name: 'The Witch’s Apology',
            steps: {
                0: 'Find out why the Marsh Witch was bound.',
                1: 'Gather three marsh reagents.',
                2: 'Bring the reagents back to be made into an unbinding draught.'
            }
        },
        boneTithe: {
            name: 'Bone‑Tithe',
            steps: {
                0: 'The catacombs demand a “tithe.”',
                1: 'Pay the tithe and survive what answers.',
                2: 'Return—if you can breathe it in.'
            }
        },
        houndOfOldRoads: {
            name: 'The Hound of Old Roads',
            steps: {
                0: 'A spectral hound has been seen at night.',
                1: 'Follow its trail across the roads.',
                2: 'Return with the truth of what you find.'
            }
        },
        crownWithoutKing: {
            name: 'A Crown Without a King',
            steps: {
                0: 'Rumors speak of crown‑shards in circulation.',
                1: 'Recover two shards from dangerous places.',
                2: 'Choose: destroy the shards or sell them.'
            }
        },
        wardensGesture: {
            name: 'The Warden’s Gesture',
            steps: {
                0: 'Perform three gestures: mercy, restraint, protection.',
                1: 'Complete the gestures and return to the Bark‑Scribe.',
                2: 'Bring proof you can rewrite what was broken.'
            }
        }
    }
}
