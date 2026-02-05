// commands/events.js - Improved version
const { ezra } = require('../fredi/ezra');
const { attribuerUnevaleur, getAllEvents } = require('../lib/welcome');

// Create event command handler
async function events(nomCom) {
    ezra({
        nomCom: nomCom,
        categorie: 'Fredi-Group',
        reaction: nomCom === 'welcome' ? '👋' : 
                 nomCom === 'goodbye' ? '👋' : 
                 nomCom === 'antipromote' ? '👑' : '📉'
    }, async (dest, zk, commandeOptions) => {
        const { ms, arg, repondre, superUser, verifAdmin, verifGroupe } = commandeOptions;

        // Only works in groups
        if (!verifGroupe) {
            return repondre("❌ This command only works in groups!");
        }

        // Check permissions
        if (!verifAdmin && !superUser) {
            return repondre("❌ You need to be an admin to use this command!");
        }

        // Get current settings
        const currentSettings = await getAllEvents(dest);
        
        // Show help if no arguments
        if (!arg || arg.length === 0) {
            const statusEmoji = currentSettings[nomCom] === 'on' ? '✅' : '❌';
            
            const helpMessage = `
🔧 *${nomCom.toUpperCase()} SETTINGS*

*Current Status:* ${statusEmoji} ${currentSettings[nomCom].toUpperCase()}

*Usage:*
• !${nomCom} on - Enable ${nomCom}
• !${nomCom} off - Disable ${nomCom}
• !${nomCom} status - Show current status

*Description:*
${nomCom === 'welcome' ? 'Sends welcome message when someone joins the group' :
 nomCom === 'goodbye' ? 'Sends goodbye message when someone leaves the group' :
 nomCom === 'antipromote' ? 'Notifies when someone is promoted to admin' :
 'Notifies when someone is demoted from admin'}
            `;
            
            return repondre(helpMessage);
        }

        const action = arg[0].toLowerCase();

        // Handle status check
        if (action === 'status') {
            const statusEmoji = currentSettings[nomCom] === 'on' ? '✅' : '❌';
            return repondre(`📊 *${nomCom.toUpperCase()} STATUS*\n\nCurrent: ${statusEmoji} ${currentSettings[nomCom].toUpperCase()}`);
        }

        // Handle on/off
        if (action === 'on' || action === 'off') {
            const success = await attribuerUnevaleur(dest, nomCom, action);
            
            if (success) {
                const emoji = action === 'on' ? '✅' : '❌';
                const message = `${emoji} *${nomCom.toUpperCase()} ${action.toUpperCase()}*\n\n${nomCom} feature has been turned ${action} for this group.`;
                
                await zk.sendMessage(dest, {
                    text: message,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        externalAdReply: {
                            showAdAttribution: true,
                            title: `${nomCom.toUpperCase()} ${action.toUpperCase()}`,
                            body: `Group: ${dest.split('@')[0]}`,
                            thumbnailUrl: "https://i.imgur.com/o2k5tW0.png",
                            sourceUrl: "https://github.com/mr-X-force",
                            mediaType: 1
                        }
                    }
                }, { quoted: ms });
            } else {
                repondre(`❌ Failed to update ${nomCom} settings. Please try again.`);
            }
        } else {
            repondre(`❌ Invalid option. Use:\n!${nomCom} on\n!${nomCom} off\n!${nomCom} status`);
        }
    });
}

// Register all event commands
events('welcome');
events('goodbye');
events('antipromote');
events('antidemote');

// Additional command to show all event settings
ezra({
    nomCom: 'events',
    categorie: 'Fredi-Group',
    reaction: '🔧'
}, async (dest, zk, commandeOptions) => {
    const { repondre, superUser, verifAdmin, verifGroupe } = commandeOptions;

    if (!verifGroupe) {
        return repondre("❌ This command only works in groups!");
    }

    if (!verifAdmin && !superUser) {
        return repondre("❌ You need to be an admin to use this command!");
    }

    try {
        const { getAllEvents } = require('../lib/welcome');
        const events = await getAllEvents(dest);
        
        const statusMessage = `
📊 *GROUP EVENTS SETTINGS*

👋 Welcome: ${events.welcome === 'on' ? '✅ ON' : '❌ OFF'}
👋 Goodbye: ${events.goodbye === 'on' ? '✅ ON' : '❌ OFF'}
👑 Anti-promote: ${events.antipromote === 'on' ? '✅ ON' : '❌ OFF'}
📉 Anti-demote: ${events.antidemote === 'on' ? '✅ ON' : '❌ OFF'}

*Commands:*
• !welcome on/off/status
• !goodbye on/off/status
• !antipromote on/off/status
• !antidemote on/off/status
        `;
        
        repondre(statusMessage);
    } catch (error) {
        console.error("Events command error:", error);
        repondre("❌ Error retrieving events settings.");
    }
});