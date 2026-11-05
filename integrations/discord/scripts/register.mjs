#!/usr/bin/env node
/*
 * Register See's slash commands with Discord (once, and whenever they change).
 *   DISCORD_APPLICATION_ID=… DISCORD_BOT_TOKEN=… node scripts/register.mjs
 * Add GUILD_ID=… to register in one server instantly while testing (global commands take up to an hour).
 */
const app = process.env.DISCORD_APPLICATION_ID;
const token = process.env.DISCORD_BOT_TOKEN;
const guild = process.env.GUILD_ID;
if (!app || !token) {
  console.error('Set DISCORD_APPLICATION_ID and DISCORD_BOT_TOKEN.');
  process.exit(1);
}
const commands = [
  {
    name: 'see',
    description: 'Rank it with the server',
    options: [
      { type: 1, name: 'rank', description: 'Post a list; everyone ranks their own', options: [{ type: 3, name: 'link', description: 'A list’s link from See (Share › Copy the link)', required: true }] },
      {
        type: 1,
        name: 'poll',
        description: 'A poll: one tap, results after you vote',
        options: [
          { type: 3, name: 'question', description: 'What are you asking?', required: true },
          { type: 3, name: 'options', description: 'The choices, separated by commas', required: true },
        ],
      },
    ],
  },
];
const url = `https://discord.com/api/v10/applications/${app}${guild ? `/guilds/${guild}` : ''}/commands`;
const res = await fetch(url, { method: 'PUT', headers: { authorization: `Bot ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(commands) });
console.log(res.ok ? `Registered ${commands.length} command${guild ? ` in server ${guild}` : ' globally'}.` : `Discord said ${res.status}: ${await res.text()}`);
