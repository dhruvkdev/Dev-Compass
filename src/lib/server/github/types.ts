export type GithubStats = {
  login: string;
  createdAt: string; // ISO date
  followers: {
    totalCount: number;
  };

  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number;
      weeks: {
        contributionDays: {
          date: string;
          contributionCount: number;
        }[];
      }[];
    };

    pullRequestContributions: {
      totalCount: number;
    };
    issueContributions: {
      totalCount: number;
    };
    pullRequestReviewContributions: {
      totalCount: number;
    };
  };

  repositories: {
    totalCount: number;
    nodes: {
      name: string;
      stargazerCount: number;
      forkCount: number;
      createdAt: string;
      isArchived: boolean;
      languages: {
        edges: {
          size: number;
          node: {
            name: string;
          };
        }[];
      };
      defaultBranchRef?: {
        target?: {
          history?: {
            totalCount: number;
          };
        };
      };
    }[];
  };

  pinnedItems: {
    nodes: {
      name: string;
      description: string | null;
      stargazerCount: number;
      forkCount: number;
      languages: {
        nodes: {
          name: string;
        }[];
      };
    }[];
  };
};
