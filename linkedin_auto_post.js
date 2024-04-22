import fetch from "node-fetch";

const accessToken = 'AQUWiGj1lrr6m11PPfEdOabwuUENVFjC7HKK64e4dt7z5eXZ1wEs-vr6e9eTpPWuZaX5MLHjlXvX9gHpvCqbRa654REfigqVmJ9lnZ1bsMAOqJjYxhzdn6DV0gLDbWUdXvCrTgEomgRH2n14XXNNHn9AA7QwjtyFINGWiIXNcsgq6a9SlAtFDQR2UZihaotMK60EhiFCem24ag1tf19RVASVdW3xg_NhcUOshY4Kh3J8LKeyPC9BNon7U9YSh7FlmalBr74jQCjQ3HaFitTp-ThWeVBeOABAw8HQ1wIb2_t38BIBSZX6Ms5dfvAaM1tUTYLNBK2ZaJG63I8La4G6o8BOl1Co_g';
let memberID;
let autopostData;
let matchIndex = 0;
const postedMatches = new Set();

async function fetchAutopost() {
  try {
    const response = await fetch('https://sportscore.io/api/v1/autopost/settings/tumblr/', {
      method: 'GET',
      headers: {
        "accept": "application/json",
        'X-API-Key': 'uqzmebqojezbivd2dmpakmj93j7gjm',
      },
    });
    const data = await response.json();
    autopostData = data;
  } catch (error) {
    console.error('Error:', error);
  }
}

async function getLinkedInMemberID() {
  try {
    const meApiUrl = 'https://api.linkedin.com/v2/me';

    const response = await fetch(meApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const responseData = await response.json();

    if (response.ok) {
      // Extract LinkedIn member ID from the response
      memberID = responseData.id;
      return memberID;
    } else {
      console.error('Error fetching LinkedIn member ID:', responseData);
      return null;
    }
  } catch (error) {
    console.error('Error fetching LinkedIn member ID:', error);
    return null;
  }
}

async function postToLinkedIn(postText, mediaLink) {
  try {
    if (!memberID) {
      memberID = await getLinkedInMemberID();
      if (!memberID) {
        console.error('Unable to fetch LinkedIn member ID.');
        return;
      }
    }

    const ugcPostApiUrl = 'https://api.linkedin.com/v2/ugcPosts';

    const postData = {
      author: `urn:li:person:${memberID}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: postText,
          },
          shareMediaCategory: 'ARTICLE',
          media: [
            {
              status: 'READY',
              description: {
                text: postText,
              },
              originalUrl: mediaLink,
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch(ugcPostApiUrl, {
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
        const hashtags = `#${homeTeam.replace(/\s+/g, '')} #${awayTeam.replace(/\s+/g, '')} #${league.replace(/\s+/g, '')}`;

        let postContent = `🎌Match Started!🎌\n\n`;
        postContent += `💥⚽️💥 ${homeTeam} vs ${awayTeam} League: ${league} 💥⚽️💥\n\n`;
        postContent += `Watch Now on SportScore: ${matchLink}\n\n`;

        postContent += `${hashtags}\n\n`;

        // Post to LinkedIn after 1 minute interval
        setTimeout(() => {
          postToLinkedIn(postContent, matchLink);
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
