const discord = require('discord.js'),
    client = new discord.Client(),
    got = require('got'),
    chalk = require('chalk'),
    config = require('./config.json'),
    axios = require('axios'),
    puppeteer = require('puppeteer');

let termsAndPages = [ // term on left, max pages on right.
    ['anime', 20],
    ['art', 8],
    ['dating', 4],
    ['economy', 2],
    ['furry', 3],
    ['gaming', 33],
    ['giveaway', 22],
    ['memes', 14],
    ['minecraft', 5],
    ['music', 10],
    ['nsfw', 14],
    ['pokemon', 4],
    ['reddit', 1],
    ['roleplay', 4],
    ['social', 17],
    ['tech', 1]
];

let inviteLink = []; // Array of invite links.
let inviteCount = 0; // Logs how many servers the account has joined.
let serverCount = undefined; // amount of servers, in case the account is already in a server.
let serverID = []; // server ID's scraped from https://discordservers.me.
let userServersID = []; // all server ID's account is in.
let index;

console.log(chalk.hex('8a0303')('\n  ██████  ██░ ██  ▄▄▄      ▓█████▄  ▒█████   █     █░\n▒██    ▒ ▓██░ ██▒▒████▄    ▒██▀ ██▌▒██▒  ██▒▓█░ █ ░█░\n░ ▓██▄   ▒██▀▀██░▒██  ▀█▄  ░██   █▌▒██░  ██▒▒█░ █ ░█ \n  ▒   ██▒░▓█ ░██ ░██▄▄▄▄██ ░▓█▄   ▌▒██   ██░░█░ █ ░█ \n▒██████▒▒░▓█▒░██▓ ▓█   ▓██▒░▒████▓ ░ ████▓▒░░░██▒██▓ \n▒ ▒▓▒ ▒ ░ ▒ ░░▒░▒ ▒▒   ▓▒█░ ▒▒▓  ▒ ░ ▒░▒░▒░ ░ ▓░▒ ▒ \n░ ░▒  ░ ░ ▒ ░▒░ ░  ▒   ▒▒ ░ ░ ▒  ▒   ░ ▒ ▒░   ▒ ░ ░  \n░  ░  ░   ░  ░░ ░  ░   ▒    ░ ░  ░ ░ ░ ░ ▒    ░   ░\n      ░   ░  ░  ░      ░  ░   ░        ░ ░      ░    \n                            ░                       '), chalk.magentaBright('\nCreated by adamb#1337 and benji#1337\n'));

(async () => {
    try {
        console.log(chalk.magenta("Attempting to start Shadow."));
        try {
            await client.login(config.token);
            serverCount = client.guilds.size // stores amount of servers into serverCount
            if (serverCount === 100) {
                console.log(chalk.red("Error: Already in 100 servers."));
                process.exit(-1);
            }
            console.log(chalk.green(`Success: Now scraping on ${client.user.tag} for invites, please wait...`));
            client.guilds.forEach(function (guild) {
                userServersID.push(guild.id); // pushes all guild id's to an array.
            });
        } catch {
            console.log(chalk.red("Invalid Token, please check your config."));
            process.exit(-1);
        }
        let serversID = []; // array of unfiltered junk
        let count = 1;

        async function idGen() {
            let randomNum = Math.floor(Math.random() * Math.floor(termsAndPages.length));
            let randomTerm = termsAndPages[randomNum];
            let randomPage = Math.floor(Math.random() * randomTerm[1]) + 1;
            let response = await got(`https://discordservers.me/servers/search?term=${randomTerm[0]}&memberc=1000&membere=5000&page=${randomPage}`);
            let links = await response.body.split('href="');

            for (const link of links) {
                if (link.indexOf('/servers/') !== -1) {
                    let linkFilter = link.split('"')[0].split('/join')[0].split('/servers/tag/')[0].split('https://')[0].split('/servers/top')[0].split('/auth/discord')[0].split('#!')[0];
                    serversID.push(linkFilter); // pushes into serversID array to filter later
                }
            }

            let filtered = [...new Set(serversID)]; // puts into set and removes dupes
            const result = filtered.filter(Boolean); // removes empty spaces.

            if (result.length <= 125) {
                count++;
                let guildIds = result.toString().split('/servers/')
                guildIds.forEach(function (ids) {
                    let b4Push = ids.split(',')[0]; // epic let name
                    serverID.push(b4Push);
                })
                console.log(chalk.cyan(`Found ${result.length} server IDs. Scraped: ${randomTerm[0]}, page ${randomPage}.`));
                await idGen();
            }

            if (result.length >= 125) {
                let dupeCheck = [...new Set(serverID)]; // puts into set and removes dupes
                const dupeFilter = dupeCheck.filter(Boolean); // removes empty spaces.
                // removes server id duplicates
                for (let i = 0; i < userServersID.length; i++) {
                    index = dupeFilter.indexOf(userServersID[i]);
                    if (index > -1) {
                        dupeFilter.splice(index, 1);
                    }
                }
                console.log(chalk.greenBright(`Success: Found ${result.length} server IDs on ${count} different pages, scraping for invite links...`));

                for (let i = 0; i < dupeFilter.length; i++) {
                    let browser = await puppeteer.launch();
                    const page = await browser.newPage();
                    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36');
                    await page.goto(`https://discordservers.me/servers/${dupeFilter[i]}/join`);
                    await ms(5000);
                    await page.mouse.move(300, 300);

                    let inv = await page.evaluate(async () => {
                        let invite = await document.querySelector('div[class="container center-align"] > a').href;

                        return {
                            invite
                        };

                    });

                    let res = await inv.invite.split('https://discord.gg/');

                    if (res[1] === "ZnwusVc") {
                        console.log(chalk.red("Couldn't get invite, trying next.")); // shitty throw of link thrown in by https://discordservers.me
                    } else {
                        inviteLink.push(res[1]);
                        for (let invites of inviteLink) {
                            inviteCount++;
                            let invite = invites;
                            let url = `https://discord.com/api/v8/invites/${invites}`;
                            await axios({
                                method: 'POST',
                                url: url,
                                headers: {
                                    'Authorization': config.token
                                }
                            }).then(
                                () => {
                                    console.log(chalk.green(`Success: Joined discord server with invite code ${invite}`));
                                }
                            ).catch(err => {
                                if (err.response.data.code === 40002) {
                                    console.log(chalk.red(`You've been hit with verification, rip.`));
                                    process.exit(-1);
                                } else {
                                    if (err.response.data.code === 40007) {
                                        console.log(chalk.red(`Banned from server invite https://disocrd.gg/${invites}`));
                                    } else {
                                        if (err.response.data.code === 30001) {
                                            console.log(chalk.green("Success: Maxed out server count."), chalk.underline.magentaBright('\nWritten by adamb#1337 and benji#1337'));
                                            process.exit(-1);
                                        } else {
                                            if (err.response.data.code === 10006) {
                                                console.log(`Unknown invite: ${invites}`);
                                            } else {
                                                console.log(chalk.red(`Error Code: ${err.response.data.code}`));
                                                process.exit(-1);
                                            }
                                        }
                                    }
                                }
                            });
                        }
                        console.log(chalk.cyan(`Found Invite Link: ${res[1]}\n  [+] Joined ${inviteCount} invite(s)`));
                        inviteLink.splice(res[1]); // splices the same invite out of array so it doesnt try to rejoin
                    }

                    await browser.close();

                    function ms(time) {
                        return new Promise(function (resolve) {
                            setTimeout(resolve, time);
                        });
                    }
                }
            }

        }

        await idGen();

    } catch (error) {
        console.log(`ERROR:\n ${error.response.body}`);
    }
})();