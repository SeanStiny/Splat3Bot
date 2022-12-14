import axios from 'axios';

/**
 * Splatoon 3 map and mode schedule.
 */
let schedule: {
  xSchedules: {
    nodes: {
      endTime: string;
      startTime: string;
      xMatchSetting: {
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
      } | null;
    }[];
  };
  bankaraSchedules: {
    nodes: {
      bankaraMatchSettings:
        | {
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
          }[]
        | null;
      endTime: string;
      startTime: string;
    }[];
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
      } | null;
    }[];
  };
  coopGroupingSchedule: {
    regularSchedules: {
      nodes: {
        endTime: string;
        startTime: string;
        setting: {
          coopStage: {
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
          }[];
        };
      }[];
    };
    bigRunSchedules: {
      nodes: {
        endTime: string;
        startTime: string;
        setting: {
          coopStage: {
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
          }[];
        };
      }[];
    };
  };
  festSchedules: {
    nodes: {
      endTime: string;
      startTime: string;
      festMatchSetting: {
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
        }[];
        vsStageId: number;
      };
    }[];
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

export function xAt(time: number) {
  let rotations = schedule.xSchedules.nodes;
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

export function splatfestAt(time: number) {
  let rotations = schedule.festSchedules.nodes;
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
  const rotations = schedule.coopGroupingSchedule.regularSchedules.nodes;
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

export function bigRunAt(time: number) {
  const rotations = schedule.coopGroupingSchedule.bigRunSchedules.nodes;
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
