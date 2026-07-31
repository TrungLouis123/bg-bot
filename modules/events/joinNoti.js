module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "2.1.0",
    credits: "Pcoder",
    description: "Thông báo khi bot hoặc người vào nhóm với ảnh/gif/video random",
    dependencies: {
        "fs-extra": "",
        "path": "",
        "pidusage": ""
    }
};

module.exports.onLoad = function () {
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];

    const path = join(__dirname, "cache", "joinGif");
    if (!existsSync(path)) mkdirSync(path, { recursive: true });

    const randomPath = join(__dirname, "cache", "joinGif", "random");
    if (!existsSync(randomPath)) mkdirSync(randomPath, { recursive: true });
};

module.exports.run = async function ({ api, event }) {
    const { join } = global.nodemodule["path"];
    const { threadID } = event;
    const fs = require("fs");
    const moment = require("moment-timezone");

    let ngay = moment.tz('Asia/Ho_Chi_Minh').format('D/MM/YYYY');
    let gio = moment.tz('Asia/Ho_Chi_Minh').format('HH:mm:ss');
    let thu = moment.tz('Asia/Ho_Chi_Minh').format('dddd');

    const thuTiengViet = {
        "Sunday": "𝗖𝗵𝘂̉ 𝗡𝗵𝗮̣̂𝘁",
        "Monday": "𝗧𝗵𝘂̛́ 𝗛𝗮𝗶",
        "Tuesday": "𝗧𝗵𝘂̛́ 𝗕𝗮",
        "Wednesday": "𝗧𝗵𝘂̛́ 𝗧𝘂̛",
        "Thursday": "𝗧𝗵𝘂̛́ 𝗡𝗮̆𝗺",
        "Friday": "𝗧𝗵𝘂̛́ 𝗦𝗮́𝘂",
        "Saturday": "𝗧𝗵𝘂̛́ 𝗕𝗮̉𝘆"
    };
    thu = thuTiengViet[thu] || thu;

    if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
        api.changeNickname(`『 ${global.config.PREFIX} 』 ⪼ ${global.config.BOTNAME || "BOT"} 🤖`, threadID, api.getCurrentUserID());
        await api.sendMessage("🔄 | Đang thực hiện kết nối...", threadID);
        await new Promise(resolve => setTimeout(resolve, 2000));

        return api.sendMessage({
            body: `╭━━━━━━━━━━━━━━━⟡\n✨ 『 𝙱𝙾𝚃 𝙳𝙰̃ 𝚅𝙰̀𝙾 𝙽𝙷𝙾́𝙼! 』 ✨\n📜 𝙻𝙴̣̂𝙽𝙷: ⟪ !menu ⟫ 𝚃𝚁𝙰 𝙲𝚄̛́𝚄 𝙳𝙰𝙽𝙷 𝚂𝙰́𝙲𝙷 𝙻𝙴̣̂𝙽𝙷!╰━━━━━━━━━━━━━━━⟡\n𝗙𝗯 𝗔𝗱𝗺𝗶𝗻: fb.com/100081293425403`,
            attachment: global.Ljzi.splice(0, 1)
        }, threadID);
    }

    else {
        try {
            const { createReadStream, existsSync, readdirSync } = global.nodemodule["fs-extra"];
            let { threadName, participantIDs } = await api.getThreadInfo(threadID);
            const threadData = global.data.threadData.get(parseInt(threadID)) || {};

            const pathGif = join(__dirname, "cache", "joinGif", `${threadID}.gif`);
            const randomPath = readdirSync(join(__dirname, "cache", "joinGif", "random"));

            let mentions = [], nameArray = [], memLength = [], i = 0;
            for (let id in event.logMessageData.addedParticipants) {
                const userName = event.logMessageData.addedParticipants[id].fullName;
                nameArray.push(userName);
                mentions.push({ tag: userName, id });
                memLength.push(participantIDs.length - i++);
            }
            memLength.sort((a, b) => a - b);

            let msg = (typeof threadData.customJoin == "undefined")
                ? `╭━━━━━❰ ★ ❱━━━━━╮\n🌟 『 𝗖𝗵𝗮̀𝗼 𝗺𝘂̛̀𝗻𝗴 』\n👑 {name} 『 𝙹𝙾𝙸𝙽 𝙶𝚁𝙾𝚄𝙿 』\n📅 『 {thu}, {ngay} 』🕒 『 {gio} 』\n👥 『 𝗡𝗵𝗼́𝗺: {threadName} 』\n💠 『 {type} 𝗹𝗮̀ 𝘁𝗵𝗮̀𝗻𝗵 𝘃𝗶𝗲̂𝗻 𝘁𝗵𝘂̛́ {soThanhVien} 』\n╰━━━━━❰ ★ ❱━━━━━╯`
                : threadData.customJoin;

            msg = msg
                .replace(/\{name}/g, nameArray.join(', '))
                .replace(/\{type}/g, (memLength.length > 1) ? "Các bạn" : "Bạn")
                .replace(/\{soThanhVien}/g, memLength.join(', '))
                .replace(/\{threadName}/g, threadName)
                .replace(/\{thu}/g, thu)
                .replace(/\{ngay}/g, ngay)
                .replace(/\{gio}/g, gio);

            let formPush;
            if (existsSync(pathGif)) {
                formPush = { body: msg, attachment: createReadStream(pathGif), mentions };
            } else if (randomPath.length != 0) {
                const pathRandom = join(__dirname, "cache", "joinGif", "random", randomPath[Math.floor(Math.random() * randomPath.length)]);
                formPush = { body: msg, attachment: createReadStream(pathRandom), mentions };
            } else {
                formPush = { body: msg, attachment: global.Ljzi.splice(0, 1), mentions };
            }

            return api.sendMessage(formPush, threadID);
        } catch (e) {
            console.log(e);
            api.sendMessage("⚠ | Đã xảy ra lỗi khi gửi thông báo chào mừng!", threadID);
        }
    }
};
