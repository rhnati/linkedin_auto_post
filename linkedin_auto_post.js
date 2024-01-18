import fetch from "node-fetch";

const accessToken = 'AQVF82vyQHcOYPLx5vshm2r80qDiLOAYLsAMklZuDxsHawGHBAuqbcZ3U-kop5EqJ5Ram0XWUoAwEqN43sdKX9OdqfqyRqMVcU3rTCmweYkXJNm7oz5AsaAzjGqQdY79pG2CRyU_mRIxYtCDWd3P2kkW5swBmCGse3Qu99oIIDNCtozW8fR9_x1L1UlAukYy7fwbYdiRx8I9ww223keA_hzKHsK53QZtzTNC64IEVcvMc2gJNtwxYNqFRTtlfA5QOenhCd82cnC-_RxzoG_ISamD0L-dHinMp0PSx_5ZJImiNlLMaZwJlg-TgLLiIcXQ8eYGZ1CpAga_ggAlKHqcn0_9wMHLZg';

// Assuming these variables are used later in the code
let autopostData;
let matchIndex = 0;
const postedMatches = new Set();

async function fetchAutopost() {
  try {
    const response = await fetch('https://sportscore.io/api/v1/autopost/settings/linkedin/', {
      method: 'GET',
      headers: {
        "accept": "application/json",
        'X-API-Key': 'uqzmebqojezbivd2dmpakmj93j7gjm',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    autopostData = data;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function postToLinkedIn(postText, mediaLink) {
  try {
    const apiUrl = 'https://api.linkedin.com/v2/shares';

    const postData = {
      owner: 'urn:li:person:77e9epcqkrfiq3',
      subject: 'Your Post Title',
      text: {
        text: postText,
      },
      distribution: {
        linkedInDistributionTarget: {},
      },
      content: {
        contentEntities: [
          {
            entity: {
              location: mediaLink,
            },
          },
        ],
        shareMediaCategory: 'ARTICLE',
      },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(postData),
    });

    const responseData = await response.json();
    console.log(responseData);
  } catch (error) {
    console.error('Error posting on LinkedIn:', error);
  }
}

async function fetchData() {
  try {
    const response = await fetch(
      "https://sportscore.io/api/v1/football/matches/?match_status=live&sort_by_time=false&page=0",
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "X-API-Key": "uqzmebqojezbivd2dmpakmj93j7gjm",
        },
      }
    );

    const data = await response.json();
    processData(data.match_groups);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function processData(matchGroups) {
  try {
    if (!Array.isArray(matchGroups)) {
      console.error("Invalid matchGroups:", matchGroups);
      return;
    }

    await fetchAutopost();
    console.log(autopostData);

    matchGroups.forEach((matchGroup) => {
      getMatch(matchGroup);
    });
  } catch (error) {
    console.error("Error processing data:", error);
  }
}

async function getMatch(matchGroup) {
  try {
    const competition = matchGroup.competition.name;

    matchGroup.matches.forEach((match) => {
      const matchId = match.id;

      if (!postedMatches.has(matchId)) {
        const homeTeam = match.home_team.name;
        const awayTeam = match.away_team.name;
        const league = competition;
        const matchLink = match.url;
        const photoLink = match.social_picture;
        const hashtags = `#${homeTeam.replace(/\s+/g, '')} #${awayTeam.replace(/\s+/g, '')} #${league.replace(/\s+/g, '')}`;

        function encodeHashtag(hashtag) {
          return encodeURIComponent(hashtag.replace(/#/g, ''));
        }

        let postContent = `💥⚽️💥 ${homeTeam} vs ${awayTeam} League: ${league} 💥⚽️💥<br>`;
        postContent += `Watch Now on SportScore: <a href="${matchLink}" target="_blank">${matchLink}</a><br>`;
        postContent += `<a href="https://www.linkedin.com/search/results/content/?keywords=${encodeHashtag(homeTeam)}" target="_blank">#${homeTeam.replace(/\s+/g, '')}</a> `;
        postContent += `<a href="https://www.linkedin.com/search/results/content/?keywords=${encodeHashtag(awayTeam)}" target="_blank">#${awayTeam.replace(/\s+/g, '')}</a> `;
        postContent += `<a href="https://www.linkedin.com/search/results/content/?keywords=${encodeHashtag(league)}" target="_blank">#${league.replace(/\s+/g, '')}</a><br>`;

        // Post to LinkedIn after 1 minute interval
        setTimeout(() => {
          postToLinkedIn(postContent, photoLink);
        }, matchIndex * 60000); // Adjusted interval based on matchIndex

        // Add matchId to the set to avoid reposting
        postedMatches.add(matchId);
        matchIndex++;
      }
    });
  } catch (error) {
    console.error("Error getting match:", error.message);
  }
}

setInterval(fetchData, 60000);

fetchData();
