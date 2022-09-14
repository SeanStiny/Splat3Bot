import axios from 'axios';

/**
 * Splatoon 3 map and mode schedule.
 */
let schedule: {
  bankaraSchedules: {
    nodes: [
      {
        bankaraMatchSettings: {
          mode: 'CHALLENGE' | 'OPEN';
          vsRule: {
            id: string;
            name: string;
            rule: string;
          };
          vsStages: {
            id: string;
            image: {
              url: string;
            };
            name: string;
            vsStageId: number;
          }[];
        }[];
        endTime: string;
        startTime: string;
      }
    ];
  };
  regularSchedules: {
    nodes: {
      endTime: string;
      startTime: string;
      regularMatchSetting: {
        vsRule: {
          id: string;
          name: string;
          rule: string;
        };
        vsStages: {
          id: string;
          image: {
            url: string;
          };
          name: string;
          vsStageId: number;
        }[];
      };
    }[];
  };
  coopGroupingSchedule: {
    regularSchedules: {
      nodes: {
        endTime: string;
        startTime: string;
        setting: {
          coopStage: {
            coopStageId: number;
            id: string;
            image: {
              url: string;
            };
            name: string;
            thumbnailImage: {
              url: string;
            };
          };
          weapons: {
            image: {
              url: string;
            };
            name: string;
          }[]
        };
      }[];
    };
  };
};

/**
 * Download and update the Splatoon 3 rotation schedule.
 */
export async function update() {
  const result = await axios.get('https://splatoon3.ink/data/schedules.json', {
    headers: { 'User-Agent': 'StinyBot (twitch.tv/SeanStiny)' },
  });

  schedule = result.data.data;
}

export function anarchyAt(time: number) {
  let rotations = schedule.bankaraSchedules.nodes;
  for (let index = 0; index < rotations.length; index++) {
    const rotation = rotations[index];
    const startTime = new Date(rotation.startTime).getTime();
    const endTime = new Date(rotation.endTime).getTime();
    if (startTime <= time && endTime > time) {
      return rotation;
    }
  }

  return null;
}

export function turfAt(time: number) {
  let rotations = schedule.regularSchedules.nodes;
  for (let index = 0; index < rotations.length; index++) {
    const rotation = rotations[index];
    const startTime = new Date(rotation.startTime).getTime();
    const endTime = new Date(rotation.endTime).getTime();
    if (startTime <= time && endTime > time) {
      return rotation;
    }
  }

  return null;
}

export function salmonAt(time: number) {
  let rotations = schedule.coopGroupingSchedule.regularSchedules.nodes;
  for (let index = 0; index < rotations.length; index++) {
    const rotation = rotations[index];
    const startTime = new Date(rotation.startTime).getTime();
    const endTime = new Date(rotation.endTime).getTime();
    if (startTime <= time && endTime > time) {
      return rotation;
    }
  }

  return null;
}
