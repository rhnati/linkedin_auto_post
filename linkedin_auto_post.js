import fetch from "node-fetch";

const accessToken = 'AQV7AEjQz-jGuJGVnsXzQuDfuRZMPHO-Dkc2OkVKKous7BIcKHwHwZSqyz2E30wFbMF0PMiElePzdpTLTJhbQ-OrIk4tNhVs7nMItK4jY5qkpGBwGDivFo-9ADdvWfa4ISWAMg0zN4nOU3wzqOEM-hLB1mdLSy0T744Re923fD6kBiC8H4W4VpY6nUqU8VclbrlYCKcxk_ktdu4Vz3EZ8q-QFapNSfmO_KzULWNWVVW47oU0WolMDxTIfmQAUXCEbgnSUqqdhSsg5V5XP9R40yW0Sizk0oqShprfkKG4ULnrLAz2A2Muvrhr8Umo50fYKIDb8-RAVf9fWx5Rqz6i23nf3CCojQ';
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
        const photoLink = match.social_picture;
        const hashtags = `#${homeTeam.replace(/\s+/g, '')} #${awayTeam.replace(/\s+/g, '')} #${league.replace(/\s+/g, '')}`;

        let postContent = `💥⚽️💥 ${homeTeam} vs ${awayTeam} League: ${league} 💥⚽️💥\n\n`;
        postContent += `Watch Now on SportScore: ${matchLink}\n\n`;

        const formattedHashtags = hashtags
          .split(' ')
          .map((tag) => `[${tag}](https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(tag)})`)
          .join(' ');

        postContent += `${formattedHashtags}\n\n`;

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
