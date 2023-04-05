const { WebClient } = require('@slack/web-api');
const dotenv = require('dotenv');

dotenv.config();

const slackToken = process.env.SLACK_BOT_TOKEN;
const client = new WebClient(slackToken);

const BIRTHDAY_FIELD_ID = 'Birthday';

async function getBirthdaysFromSlack() {
  try {
    const response = await client.users.list();
    const users = response.members;
    const birthdays = [];

    for (const user of users) {
      if (!user.is_bot && !user.deleted) {
        const userId = user.id;
        const displayName = user.profile.display_name || user.profile.real_name;
        const birthday = user.profile[BIRTHDAY_FIELD_ID];
        if (birthday) {
          birthdays.push({ userId, birthday, name: displayName });
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
  const today = new Date().toISOString().slice(0, 10);

  for (const person of birthdays) {
    if (person.birthday === today) {
      await sendBirthdayWishes(person.userId, person.name);
    }
  }
}

main();
