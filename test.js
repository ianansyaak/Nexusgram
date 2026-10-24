import fetch from 'node-fetch';

fetch("http://127.0.0.1:3000/api/telegram/dialogs")
  .then(r => r.json())
  .then(d => {
     if (d.error) return console.log(d.error);
     const chatId = d[0].id;
     fetch("http://127.0.0.1:3000/api/telegram/messages/" + chatId)
       .then(r => r.json())
       .then(ms => console.log(ms.error ? ms : "Success! Length: " + ms.length))
  });
