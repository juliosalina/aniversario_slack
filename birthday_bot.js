const { WebClient } = require('@slack/web-api');
const dotenv = require('dotenv');

dotenv.config();

const slackToken = process.env.SLACK_BOT_TOKEN;
const client = new WebClient(slackToken);

function convertDateFormat(birthday) {
  const isWrongFormat = /^\d{2}\/\d{2}\/\d{4}$/.test(birthday);
  if (isWrongFormat) {
    const [day, month, year] = birthday.split('/');
    return `${year}-${month}-${day}`;
  }
  return birthday;
}

async function getBirthdaysFromSlack() {
  try {
    const response = await client.users.list();
    const users = response.members;
    const birthdays = [];

    for (const user of users) {
      if (!user.is_bot && !user.deleted) {
        const userId = user.id;
        const response_new = await client.users.profile.get({ user: userId });
        const displayName = user.profile.display_name || user.profile.real_name;
        const birthday = response_new.profile.fields['Xf051TAX1QQJ'];

        if (birthday) {
          const formattedBirthday = convertDateFormat(birthday['value']);
          birthdays.push({ userId, birthday: formattedBirthday, name: displayName });
        }
      }
    }

    return birthdays;
  } catch (error) {
    console.error(`Error fetching user list: ${error}`);
    return [];
  }
}

async function sendBirthdayWishes(userId, name) {
  try {
    const imageUrl = 'https://s3.amazonaws.com/prd.static.4all.com/aniversario_de_vida.gif';
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:tada: Olá, *${name}*! :birthday: Espero que esteja bem! Vim aqui para desejar um FELIZ ANIVERSÁRIO!!\nA 4all é feita de pessoas para pessoas, por isso desejamos que seja um ano próspero e repleto de amor.\nConta com a gente. :tada:`,
        },
      },
      {
        type: 'image',
        title: {
          type: 'plain_text',
          text: 'Feliz Aniversário!',
        },
        image_url: imageUrl,
        alt_text: 'Imagem de Feliz Aniversário',
      },
    ];

    await client.chat.postMessage({
      channel: userId,
      blocks,
    });
  } catch (error) {
    console.error(`Error sending message: ${error}`);
  }
}

async function main() {
  const birthdays = await getBirthdaysFromSlack();
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  for (const person of birthdays) {
    const [year, month, day] = person.birthday.split('-').map(Number);
    if (month === currentMonth && day === currentDay) {
      await sendBirthdayWishes(person.userId, person.name);
    }
  }
}

main();
