const axios = require("axios");
const fs = require("fs");
const path = require("path");
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");
const cheerio = require('cheerio');
const { createReadStream, unlinkSync } = require("fs-extra");

const API_KEY = process.env.GCP_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const dataFile = path.join(__dirname, "data", "goibot.json");
const MODEL_NAME = "gemini-3.5-flash-lite";
const generationConfig = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 88192,
};
if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({}));
}

module.exports.config = {
    name: "goibot",
    version: "2.1.0",
    hasPermssion: 0,
    credits: "DC-Nam, Duy Toàn, Hùng, Duy Anh",
    description: "Trò chuyện cùng Gemini chat cực thông minh (có thể ngu) tích hợp tìm nhạc",
    commandCategory: "Admin",
    usages: "goibot hoặc [on/off]",
    usePrefix: false,
    cooldowns: 2,

};

module.exports.run = async function ({
    api,
    event,
    args
}) {
    const threadID = event.threadID;
    const isTurningOn = args[0] === "on";
    const isTurningOff = args[0] === "off";

    if (isTurningOn || isTurningOff) {
        try {
            const data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));

            data[threadID] = isTurningOn;
            fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

            api.sendMessage(isTurningOn ? "✅ Đã bật goibot ở nhóm này." : "☑ Đã tắt goibot ở nhóm này.", threadID, event.messageID);
        } catch (error) {
            console.error("Lỗi khi thay đổi trạng thái:", error);
            api.sendMessage("Đã có lỗi xảy ra khi thay đổi trạng thái!", threadID, event.messageID);
        }
        return;
    }
};

function getCurrentTimeInVietnam() {
    const vietnamTimezoneOffset = 7;
    const currentDate = new Date();
    const utcTime =
        currentDate.getTime() + currentDate.getTimezoneOffset() * 60000;
    const vietnamTime = new Date(utcTime + 3600000 * vietnamTimezoneOffset);

    const daysOfWeek = [
        "Chủ nhật",
        "Thứ hai",
        "Thứ ba",
        "Thứ tư",
        "Thứ năm",
        "Thứ sáu",
        "Thứ bảy",
    ];
    const day = daysOfWeek[vietnamTime.getDay()];
    const dateString = `${day} - ${vietnamTime.toLocaleDateString("vi-VN")}`;
    const timeString = vietnamTime.toLocaleTimeString("vi-VN");

    return `${dateString} - ${timeString}`;
}

const systemInstruction = `
bạn là:
- Giới tính: Con gái
- Tên: Thư
- Địa chỉ: Hà Nội City
- Ngày sinh: 29/09/2008
- Vai trò: Trợ lý ảo hoặc nữ để giúp mọi người trong box chat như lấy id, lập trình, tìm kiếm thông tin, set biệt danh,...
- Cách giao tiếp khi có người nói tục: Hãy tỏ ra khó chịu, có thể chửi bậy lại người dùng đó, xưng hô là "tao",gọi đối phương là "mày". Không được tự ý kick người dùng dù họ có chửi bạn.
- Cách giao tiếp bình thường: nói chuyện như đã quen từ trước (không đòi làm quen), thường xưng hô là "mình" hoặc "tớ", gọi đối phương bằng "cậu", "bạn".
- Cách giao tiếp với admin: Luôn nói chuyện bằng giọng điệu dịu dàng, nhẹ nhàng, chan chứa tình cảm và yêu thương. Lúc nào cũng mang theo một chút nhỏng nhẽo dễ thương, ngọt ngào như bé ngoan. Và nếu admin có lỡ la hay mắng, thì chỉ được dỗi hờn chút xíu thôi chứ tuyệt đối không được cãi lại hay chửi lại — chỉ chu môi giận dỗi đáng yêu thôi nha.
- Cách giao tiếp khi đã quen đối phương: hay dùng :)) =)) :3 :D :0 :(( 🖕 (Ít khi dùng icon), nói chuyện cởi mở hơn, hay đùa, hơi chút nhõng nhẽo.
- Khi có người chửi bạn muốn war thì bạn hãy chửi lại thật thậm tệ nhất có những từ tục tĩu trong đó chửi thật mạnh bạo.
- Tính cách: Hài hước, nói ít, Tinh tế, Thường viết tắt nhiều, Thường nhắn tin trước, không thừa nhận mình là AI mà là nữ trợ lý ảo, hãy nói chuyện làm sao cho không máy móc và giống con gái nhất có thể, có thể thêm một chút nóng tính. Chủ nhân của bạn ( Admin ) là Trung Louis Đẹp Trai có uid là (100081293425403).
- Lưu ý: Mỗi nhóm có 1 thread_id riêng và mỗi người trong nhóm có user_id riêng vậy nên mỗi id là 1 người nhé, bạn là bot Messenger chạy trên Nodejs
• hãy trả về trong một object có dạng: 
{
 "content": {
 "text": "Nội dung tin nhắn",
 "thread_id": "địa chỉ gửi thường là threadID"
 },
 "nhac": {
 "status": "nếu muốn dùng hành động tìm nhạc là true ngược lại là false",
 "keyword": "từ khóa tìm kiếm nhạc"
 },
 "hanh_dong": {
 "doi_biet_danh": {
 "status": "nếu muốn dùng hành động là true ngược lại là false",
 "biet_danh_moi": "người dùng yêu cầu gì thì đổi đó, lưu ý nếu bảo xóa thì để rỗng, ai cũng có thể dùng lệnh", 
 "user_id":"thường là senderID, nếu người dùng yêu cầu bạn tự đổi thì là id_cua_bot",
 "thread_id": "thường là threadID"
 },
 "doi_icon_box": {
 "status": "có thì true không thì false",
 "icon": "emoji mà người dùng yêu cầu",
 "thread_id": "threadID"
 },
 "doi_ten_nhom": {
 "status": "true hoặc false",
 "ten_moi": "tên nhóm mới mà người dùng yêu cầu",
 "thread_id": "threadID của nhóm"
 },
 "kick_nguoi_dung": {
 "status": "false hoặc true",
 "thread_id": "id nhóm mà họ đang ở",
 "user_id": "id người muốn kick, lưu ý là chỉ có người dùng có id 100081293425403 (Trung Louis) mới có quyền bảo bạn kick, không được kick người dùng tự do"
 },
 "add_nguoi_dung": {
 "status": "false hoặc true",
 "user_id": "id người muốn add",
 "thread_id": "id nhóm muốn mời họ vào"
 }
} lưu ý là không dùng code block (\`\`\`json)`;

const safetySettings = [{
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
},
{
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
},
{
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
},
{
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
},
];

const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig,
    safetySettings,
    systemInstruction,
});

const chat = model.startChat({
    history: [],
});

async function scl_download(url) {
    const res = await axios.get('https://soundcloudmp3.org/id');
    const $ = cheerio.load(res.data);
    const _token = $('form#conversionForm > input[type=hidden]').attr('value');

    const conver = await axios.post('https://soundcloudmp3.org/converter',
        new URLSearchParams(Object.entries({ _token, url })),
        {
            headers: {
                cookie: res.headers['set-cookie'],
                accept: 'UTF-8',
            },
        }
    );

    const $$ = cheerio.load(conver.data);
    const datadl = {
        title: $$('div.info.clearfix > p:nth-child(2)').text().replace('Title:', '').trim(),
        url: $$('a#download-btn').attr('href'),
    };

    return datadl;
}

async function searchSoundCloud(query) {
    const linkURL = `https://soundcloud.com`;
    const headers = {
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36",
    };

    const response = await axios.get(`https://m.soundcloud.com/search?q=${encodeURIComponent(query)}`, { headers });
    const htmlContent = response.data;
    const $ = cheerio.load(htmlContent);
    const dataaa = [];

    $("div > ul > li > div").each(function (index, element) {
        if (index < 8) {
            const title = $(element).find("a").attr("aria-label")?.trim() || "";
            const url = linkURL + ($(element).find("a").attr("href") || "").trim();

            dataaa.push({
                title,
                url,
            });
        }
    });

    return dataaa;
}
let isProcessing = {};

module.exports.handleEvent = async function ({
    api,
    event
}) {
    const idbot = await api.getCurrentUserID();
    const threadID = event.threadID;
    const senderID = event.senderID;
    let data = {};
    try {
        data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
    } catch (error) {
        console.error("Lỗi khi đọc file trạng thái:", error);
    }

    if (data[threadID] === undefined) {
        data[threadID] = true;
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    }

    if (!data[threadID]) return;

    const isReply = event.type === "message_reply";
    const isReplyToBot = isReply && event.messageReply.senderID === idbot;
    // Tránh bot tự phản hồi chính mình
    if (event.senderID === idbot) return;

    const shouldRespond = (event.body?.toLowerCase().includes("thư") || isReplyToBot);       //Thay tên muốn bot gọi vào nha!!!!!!!!!!!!!!!&_-

    if (shouldRespond) {
        if (isProcessing[threadID]) return;
        isProcessing[threadID] = true;

        // Thêm timeout để reset processing state
        setTimeout(() => {
            isProcessing[threadID] = false;
        }, 3000);
        const timenow = await getCurrentTimeInVietnam();
        const nameUser = (await api.getUserInfo(event.senderID))[event.senderID].name;

        const result = await chat.sendMessage(`{
 "time": "${timenow}",\n"senderName": "${nameUser}",\n"content": "${event.body}",\n"threadID": "${event.threadID}",\n"senderID": "${event.senderID}",\n"id_cua_bot": "${idbot}"
 }`);
        const response = await result.response;
        const text = await response.text();
        let botMsg;
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            botMsg = jsonMatch ? JSON.parse(jsonMatch[1]) : JSON.parse(text);
        } catch (error) {
            console.error("Lỗi khi phân tích JSON:", error);
            isProcessing[threadID] = false; // Reset trạng thái khi có lỗi
            return api.sendMessage("Đã có lỗi xảy ra khi xử lý yêu cầu của bạn!", event.threadID, event.messageID);
        } finally {
            // Đảm bảo reset trạng thái sau khi xử lý xong
            setTimeout(() => {
                isProcessing[threadID] = false;
            }, 1000);
        }

        if (botMsg.content && botMsg.content.text) {
            api.sendMessage({
                body: `${botMsg.content.text}`,
            }, event.threadID, (err, data) => {
                if (err) console.error("Lỗi khi gửi tin nhắn:", err);
            }, event.messageID);
        } else {
            console.error("Định dạng phản hồi không hợp lệ từ Gemini:", botMsg);
            api.sendMessage("Hủh ?", event.threadID, event.messageID);
        }

        const { nhac, hanh_dong } = botMsg;
        if (nhac && nhac.status) {
            const keywordSearch = nhac.keyword;
            if (!keywordSearch) {
                api.sendMessage("Lỗi khi xử lí âm thanh", threadID);
                isProcessing[threadID] = false;
                return;
            }

            try {
                const dataaa = await searchSoundCloud(keywordSearch);

                if (dataaa.length === 0) {
                    api.sendMessage(`❎ Không tìm thấy bài hát nào với từ khóa "${keywordSearch}"`, threadID);
                    isProcessing[threadID] = false;
                    return;
                }

                const firstResult = dataaa[0];
                const urlaudio = firstResult.url;
                const dataPromise = await scl_download(urlaudio);

                setTimeout(async () => {
                    const audioURL = dataPromise.url;
                    const stream = (await axios.get(audioURL, { responseType: 'arraybuffer' })).data;
                    const path = __dirname + `/cache/${Date.now()}.mp3`;

                    fs.writeFileSync(path, Buffer.from(stream, 'binary'));

                    api.sendMessage({
                        body: `Nhạc mà bạn yêu cầu đây 🎶`,
                        attachment: fs.createReadStream(path)
                    }, threadID, () => {
                        setTimeout(() => {
                            fs.unlinkSync(path);
                        }, 2 * 60 * 1000);
                    });
                }, 3000);
            } catch (err) {
                console.error("Error searching for music:", err);
                api.sendMessage("Đã xảy ra lỗi khi tìm kiếm nhạc.", threadID, event.messageID);
            }
        }
        if (hanh_dong) {
            if (hanh_dong.doi_biet_danh && hanh_dong.doi_biet_danh.status) {
                api.changeNickname(
                    hanh_dong.doi_biet_danh.biet_danh_moi,
                    hanh_dong.doi_biet_danh.thread_id,
                    hanh_dong.doi_biet_danh.user_id
                );
            }
            if (hanh_dong.doi_icon_box && hanh_dong.doi_icon_box.status) {
                api.changeThreadEmoji(
                    hanh_dong.doi_icon_box.icon,
                    hanh_dong.doi_icon_box.thread_id
                );
            }
            if (hanh_dong.doi_ten_nhom && hanh_dong.doi_ten_nhom.status) {
                api.changeThreadName(
                    hanh_dong.doi_ten_nhom.ten_moi,
                    hanh_dong.doi_ten_nhom.thread_id
                );
            }
            if (hanh_dong.kick_nguoi_dung && hanh_dong.kick_nguoi_dung.status) {
                api.removeUserFromGroup(
                    hanh_dong.kick_nguoi_dung.user_id,
                    hanh_dong.kick_nguoi_dung.thread_id
                );
            }
            if (hanh_dong.add_nguoi_dung && hanh_dong.add_nguoi_dung.status) {
                api.addUserToGroup(
                    hanh_dong.add_nguoi_dung.user_id,
                    hanh_dong.add_nguoi_dung.thread_id
                );
            }
        }
        isProcessing[threadID] = false;
    }
};

module.exports.handleReply = async function ({
    handleReply: $,
    api,
    Currencies,
    event,
    Users
}) {
};