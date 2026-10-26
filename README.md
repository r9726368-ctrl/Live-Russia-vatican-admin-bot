# LIVE RUSSIA | VATICAN — Admin Discord Setup Bot

This is a one-time setup utility. It creates the planned categories, channels, and roles, then applies private channel permissions.

## Before you run it

- Use a Discord application/bot that you control.
- Invite it to your existing server with `Manage Channels` and `Manage Roles`.
- Put the bot's role high enough in the role list to create/manage the roles it creates.
- Never share the bot token with anyone or put it in public source code.
- Do not grant `Administrator` unless you fully understand the risk; this script does not require it.
- The script does not delete existing channels or roles.
- Existing matching categories/channels have their permission overwrites updated to the planned access rules.

## Environment variables

Set these in your hosting provider's Secrets / Environment Variables section:

- `DISCORD_BOT_TOKEN` — token from Discord Developer Portal > your application > Bot
- `DISCORD_GUILD_ID` — your existing server ID

## Run

```bash
npm install
npm start
```

The script runs once, logs what it created/updated, and exits.

## Android notes

You can manage files and environment variables through a mobile browser on a supported Node.js hosting service. Host availability and free-tier behavior can change. Do not paste your bot token into a chat or public GitHub repository.

## After setup

1. In Discord, open Server Settings > Roles.
2. Assign the appropriate staff roles to approved admins manually.
3. Confirm the role hierarchy is sensible.
4. Test with an ordinary/non-admin account that it cannot see private channels.
5. Check category and channel permissions in Discord.

The bot cannot know which members are authorized staff, so it does not automatically assign roles to users.
