export const GET_USER_PROFILE = `
  query getUserProfile($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      username
      profile {
        ranking
      }
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

export const GET_SKILL_STATS = `
  query getSkillStats($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        advanced {
          tagName
          tagSlug
          problemsSolved
        }
        intermediate {
          tagName
          tagSlug
          problemsSolved
        }
        fundamental {
          tagName
          tagSlug
          problemsSolved
        }
      }
    }
  }
`;

export const GET_LANGUAGE_STATS = `
  query getLanguageStats($username: String!) {
    matchedUser(username: $username) {
      languageProblemCount {
        languageName
        problemsSolved
      }
    }
  }
`;

export const GET_RECENT_SUBMISSIONS = `
  query getRecentSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
    }
  }
`;
