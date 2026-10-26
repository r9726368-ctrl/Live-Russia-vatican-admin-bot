const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !GUILD_ID) {
  console.error("Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID environment variable.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const ROLE_DEFS = [
  { name: "Founder", color: 0xD4AF37, permissions: [PermissionFlagsBits.ViewAuditLog] },
  { name: "Head Administration", color: 0xB84A4A, permissions: [] },
  { name: "Senior Administrator", color: 0x4786B8, permissions: [] },
  { name: "Administrator", color: 0x3AA6A0, permissions: [] },
  { name: "Junior Administrator", color: 0x7D91A6, permissions: [] },
  { name: "Admin Trainee", color: 0x929292, permissions: [] },
  { name: "Administration Bot", color: 0x6C79D8, permissions: [] },
];

const FULL_STAFF = [
  "Founder", "Head Administration", "Senior Administrator",
  "Administrator", "Junior Administrator", "Admin Trainee"
];
const SENIOR_STAFF = ["Founder", "Head Administration", "Senior Administrator"];

const CATEGORY_DEFS = [
  {
    name: "01 — ADMINISTRATION DESK",
    access: FULL_STAFF,
    channels: [
      ["admin-announcements", "Official notices from the administration team."],
      ["admin-general", "Internal day-to-day administration discussion."],
      ["duty-status", "Staff duty and availability updates."],
      ["staff-notices", "Important internal staff notices."],
      ["meeting-schedule", "Administration meeting dates and agendas."]
    ]
  },
  {
    name: "02 — COMPLAINT MANAGEMENT",
    access: FULL_STAFF,
    channels: [
      ["complaint-queue", "Complaints waiting for review."],
      ["evidence-review", "Review submitted evidence and timestamps."],
      ["pending-evidence", "Cases awaiting additional evidence."],
      ["final-decisions", "Finalized complaint decisions."],
      ["closed-complaints", "Archive of closed complaint discussions."]
    ]
  },
  {
    name: "03 — ADMIN OPERATIONS",
    access: FULL_STAFF,
    channels: [
      ["admin-questions", "Internal questions for the administration team."],
      ["rule-clarifications", "Rule interpretation and clarifications."],
      ["action-records", "Record administrative actions and outcomes."],
      ["incident-reports", "Document incidents for appropriate review."],
      ["shift-handover", "Handover notes between staff shifts."]
    ]
  },
  {
    name: "04 — STAFF DEVELOPMENT",
    access: FULL_STAFF,
    channels: [
      ["admin-guidelines", "Approved administration guidelines."],
      ["training-material", "Training and reference materials."],
      ["staff-feedback", "Constructive internal staff feedback."],
      ["review-requests", "Requests for review or guidance."]
    ]
  },
  {
    name: "05 — SENIOR ADMINISTRATION",
    access: SENIOR_STAFF,
    channels: [
      ["senior-discussion", "Private discussion for senior administration."],
      ["decision-approvals", "Cases requiring senior approval."],
      ["sensitive-cases", "Restricted access; share only necessary information."],
      ["internal-reviews", "Senior review and quality checks."]
    ]
  },
  {
    name: "06 — SYSTEM & LOGS",
    access: FULL_STAFF,
    channels: [
      ["bot-commands", "Commands for approved administration bots."],
      ["moderation-logs", "Moderation bot logs and audit references."],
      ["member-activity", "Relevant server activity logs."],
      ["system-alerts", "Bot and system status alerts."]
    ]
  },
  {
    name: "07 — VOICE & MEETINGS",
    access: FULL_STAFF,
    channels: [
      ["Administration Meeting", null, "voice"],
      ["Staff Discussion", null, "voice"],
      ["AFK", null, "voice"]
    ]
  },
  {
    name: "08 — SENIOR VOICE",
    access: SENIOR_STAFF,
    channels: [
      ["Senior Meeting", null, "voice"]
    ]
  }
];

function channelOverwrites(guild, roles, allowedRoleNames) {
  const allowedIds = allowedRoleNames
    .map(name => roles.get(name)?.id)
    .filter(Boolean);

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    ...allowedIds.map(id => ({
      id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
      ]
    }))
  ];

  const botRole = roles.get("Administration Bot");
  if (botRole) {
    overwrites.push({
      id: botRole.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
      ]
    });
  }
  return overwrites;
}

async function ensureRole(guild, def) {
  let role = guild.roles.cache.find(r => r.name === def.name);
  if (!role) {
    role = await guild.roles.create({
      name: def.name,
      color: def.color,
      permissions: def.permissions,
      reason: "Set up LIVE RUSSIA | VATICAN administration workspace"
    });
    console.log(`Created role: ${def.name}`);
  } else {
    console.log(`Role exists: ${def.name}`);
  }
  return role;
}

async function ensureCategory(guild, name, overwrites) {
  let category = guild.channels.cache.find(
    c => c.type === ChannelType.GuildCategory && c.name === name
  );
  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: overwrites,
      reason: "Set up administration category"
    });
    console.log(`Created category: ${name}`);
  } else {
    await category.permissionOverwrites.set(overwrites, "Apply administration category privacy");
    console.log(`Updated category permissions: ${name}`);
  }
  return category;
}

async function ensureChannel(guild, category, name, topic, kind, overwrites) {
  const type = kind === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText;
  let channel = guild.channels.cache.find(
    c => c.parentId === category.id && c.name === name && c.type === type
  );
  if (!channel) {
    channel = await guild.channels.create({
      name,
      type,
      parent: category.id,
      ...(topic ? { topic } : {}),
      permissionOverwrites: overwrites,
      reason: "Set up administration channel"
    });
    console.log(`Created channel: ${name}`);
  } else {
    await channel.permissionOverwrites.set(overwrites, "Apply administration channel privacy");
    if (topic && channel.type === ChannelType.GuildText && channel.topic !== topic) {
      await channel.setTopic(topic, "Update administration channel description");
    }
    console.log(`Updated existing channel: ${name}`);
  }
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.channels.fetch();
    await guild.roles.fetch();

    const roles = new Map();
    for (const def of ROLE_DEFS) {
      roles.set(def.name, await ensureRole(guild, def));
    }

    for (const categoryDef of CATEGORY_DEFS) {
      const overwrites = channelOverwrites(guild, roles, categoryDef.access);
      const category = await ensureCategory(guild, categoryDef.name, overwrites);

      for (const [name, topic, kind = "text"] of categoryDef.channels) {
        await ensureChannel(
          guild,
          category,
          name,
          topic,
          kind,
          channelOverwrites(guild, roles, categoryDef.access)
        );
      }
    }

    console.log("\nSetup complete.");
    console.log("IMPORTANT: Assign the created staff roles to approved admins manually.");
    console.log("Review role order and test access with a non-admin account.");
  } catch (error) {
    console.error("Setup failed:", error);
    console.error("Check bot permissions, guild ID, and bot role position.");
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(TOKEN);
