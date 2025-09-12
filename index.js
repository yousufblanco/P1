console.log("Starting bot...");
console.log("Token starts with:", process.env.DISCORD_TOKEN?.slice(0,10));
// index.js (محدث) 
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ملف حفظ البيانات
const dataFile = path.join(__dirname, 'data.json');
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));

function loadData() {
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function formatDuration(minutes) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  let parts = [];
  if (days > 0) parts.push(`${days} يوم`);
  if (hours > 0) parts.push(`${hours} ساعة`);
  if (mins > 0) parts.push(`${mins} دقيقة`);
  return parts.length ? parts.join(' ') : '0 دقيقة';
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const guildId = message.guild.id;
  const channelId = message.channel.id;
  const userId = message.author.id;
  const content = message.content.trim();

  const data = loadData();

  // تهيئة الهيكل
  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][channelId]) data[guildId][channelId] = {};

  // تسجيل الدخول
  if (content === 'د') {
    if (!data[guildId][channelId][userId]) data[guildId][channelId][userId] = { total: 0, sessions: [], current: null };
    data[guildId][channelId][userId].current = Date.now();
    saveData(data);
    message.reply(`حياك الله <@${userId}> 🌟 تم تسجيل دخولك بنجاح`);
  }

  // تسجيل الخروج
  if (content === 'خ') {
    if (data[guildId][channelId][userId] && data[guildId][channelId][userId].current) {
      const duration = Date.now() - data[guildId][channelId][userId].current;
      data[guildId][channelId][userId].total += duration;
      data[guildId][channelId][userId].sessions.push(duration);
      data[guildId][channelId][userId].current = null;
      saveData(data);

      const minutes = Math.floor(duration / 60000);
      message.reply(`تم تسجيل خروجك بنجاح <@${userId}> ⏱ وقت الجلسة: ${formatDuration(minutes)}`);
    } else {
      message.reply(`لم تسجل دخولك بعد 🌟`);
    }
  }

  // تقرير أسبوعي
  if (content === '!stats_week') {
    if (!data[guildId][channelId]) return;
    let reportArr = [];
    for (const [id, info] of Object.entries(data[guildId][channelId])) {
      const totalMin = Math.floor(info.total / 60000);
      reportArr.push({ id, minutes: totalMin });
    }
    reportArr.sort((a, b) => b.minutes - a.minutes);

    let report = '📊 **تقرير التواجد الأسبوعي (من الأكثر إلى الأقل)**\n';
    for (const r of reportArr) {
      report += `<@${r.id}> : ${formatDuration(r.minutes)}\n`;
    }
    message.channel.send(report);
  }

  // تقرير شهري
  if (content === '!stats_month') {
    if (!data[guildId][channelId]) return;
    let reportArr = [];
    for (const [id, info] of Object.entries(data[guildId][channelId])) {
      const totalMin = Math.floor(info.total / 60000);
      reportArr.push({ id, minutes: totalMin });
    }
    reportArr.sort((a, b) => b.minutes - a.minutes);

    let report = '📊 **تقرير التواجد الشهري (من الأكثر إلى الأقل)**\n';
    for (const r of reportArr) {
      report += `<@${r.id}> : ${formatDuration(r.minutes)}\n`;
    }
    message.channel.send(report);
  }
});

client.login(process.env.DISCORD_TOKEN);
