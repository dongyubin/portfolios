const fs = require('fs');
const fetch = require('node-fetch');
const moment = require('moment');
var Lists = ['https://www.bilibili.com/video/BV1FP4y1E7pw', 'https://www.bilibili.com/video/BV1CE411u7gi/', 'https://github.com/dongyubin/Free-AppleId-Serve', 'https://github.com/dongyubin/nuc8i5beh', 'https://github.com/dongyubin/OldClockTodo', 'https://github.com/dongyubin/douban'];
var results = []; // 用于存储结果的数组

processLinks();
async function processLinks() {
  for (var i = 0; i < Lists.length; i++) {
    var link = Lists[i];
    await parseLink(link).then(res => {
      results.push(res); // 将结果存储到数组中
      console.log(res);
    });
  }
  saveResults(results); // 保存结果到文件
}

async function parseLink(Link) {
  const ua =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  var url = new URL(Link);
  var domain = url.hostname;
  let result;
  switch (domain) {
    case "www.bilibili.com": {
      const bvid = url.pathname.split("/")[2]
      const { data } = await (await fetch(
        `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
        {
          headers: {
            "User-Agent": ua,
            Referer: "https://www.bilibili.com/",
          },
        }
      )).json();
      if (data) {
        result = {
          url: Link,
          domain: domain,
          title: data.title,
          desc: data.desc,
          pic: data.pic,
          ctime: moment.unix(data.pubdate).format('YYYY-MM-DD HH:mm:ss'),
          viewsCount: data.stat.view,
          commentsCount: data.stat.reply + data.stat.danmaku,
          // data: data
        }
      }
      break
    }
    case "www.pixiv.net": {
      const id = url.pathname.split("/")[2]
      const { body } = await (
        await fetch(`https://www.pixiv.net/ajax/illust/${id}`, {
          headers: {
            "User-Agent": ua,
            Referer: "https://www.pixiv.net/",
          },
        })
      ).json()

      if (body) {
        result = {
          url: Link,
          domain: domain,
          data: body
        }
      }
    }

    case "twitter.com": {
      const id = url.pathname.split("/")[3]
      const data = await (
        await fetch(
          `https://cdn.syndication.twimg.com/tweet-result?id=${id}`,
          {
            headers: {
              "User-Agent": ua,
              Referer: "https://twitter.com/",
            },
          },
        )
      ).json()
      if (data) {
        result = {
          url: Link,
          domain: domain,
          data: data,
        }
      }
    }
    case "github.com": {
      const repoData = await (
        await fetch(
          `https://api.github.com/repos/${url.pathname.split("/")[1]}/${url.pathname.split("/")[2]
          }`,
        )
      ).json()
      const issuesData = await (
        await fetch(
          `https://api.github.com/repos/${url.pathname.split("/")[1]}/${url.pathname.split("/")[2]
          }/issues`,
        )
      ).json()
      if (repoData || issuesData) {
        result = {
          url: Link,
          domain: domain,
          title: repoData.full_name,
          desc: repoData.description,
          pic: `https://xlog.app/cdn-cgi/image/width=1920,quality=75,format=auto,onerror=redirect/https://opengraph.githubassets.com/8d86d6c69d196e84ea81c65ce0b4f74f82f4484eb5a6cd8b2f32d670fd10aea7/${url.pathname.split("/")[1]}/${url.pathname.split("/")[2]}`,
          ctime: moment(repoData.created_at).format('YYYY-MM-DD HH:mm:ss'),
          viewsCount: repoData.stargazers_count,
          commentsCount: issuesData
          // data: repoData,
        }
      }
      break
    }
  }
  return result;
}

function saveResults(results) {
  const data = JSON.stringify(results);
  fs.writeFile('data.json', data, (err) => {
    if (err) {
      console.error('Error saving results:', err);
    } else {
      console.log('Results saved successfully.');
    }
  });
}
