import { FlowData, NodeType } from './types';

export function generateSampleFlow(): FlowData {
  return {
    nodes: [
      {
        id: 'start',
        type: NodeType.State,
        position: { x: 250, y: 0 },
        data: { label: 'Start' },
        style: { background: '#d0f0d0', border: '1px solid #60a060' }
      },
      {
        id: 'init',
        type: NodeType.State,
        position: { x: 250, y: 100 },
        data: { label: 'Initialize Game', description: 'Load assets and setup game state' }
      },
      {
        id: 'idle',
        type: NodeType.State,
        position: { x: 250, y: 200 },
        data: { label: 'Idle', description: 'Waiting for player input' }
      },
      {
        id: 'spin',
        type: NodeType.State,
        position: { x: 250, y: 300 },
        data: { label: 'Spin', description: 'Spinning the reels' }
      },
      {
        id: 'condition-1',
        type: NodeType.Condition,
        position: { x: 250, y: 400 },
        data: { 
          label: 'Check Result', 
          condition: 'Win or No Win?',
          metadata: { sourcePhase: 'spin' } 
        }
      },
      {
        id: 'win',
        type: NodeType.State,
        position: { x: 100, y: 500 },
        data: { label: 'Win', description: 'Player won credits' }
      },
      {
        id: 'no-win',
        type: NodeType.State,
        position: { x: 400, y: 500 },
        data: { label: 'No Win', description: 'Return to idle state' }
      },
      {
        id: 'bonus',
        type: NodeType.State,
        position: { x: 100, y: 600 },
        data: { label: 'Bonus Round', description: 'Special bonus feature' }
      }
    ],
    edges: [
      {
        id: 'edge-start-init',
        source: 'start',
        target: 'init',
        animated: true
      },
      {
        id: 'edge-init-idle',
        source: 'init',
        target: 'idle',
        animated: true
      },
      {
        id: 'edge-idle-spin',
        source: 'idle',
        target: 'spin',
        animated: true,
        label: 'Spin Button'
      },
      {
        id: 'edge-spin-condition',
        source: 'spin',
        target: 'condition-1',
        animated: true
      },
      {
        id: 'edge-condition-win',
        source: 'condition-1',
        target: 'win',
        animated: false,
        label: 'Win'
      },
      {
        id: 'edge-condition-nowin',
        source: 'condition-1',
        target: 'no-win',
        animated: false,
        label: 'No Win'
      },
      {
        id: 'edge-win-bonus',
        source: 'win',
        target: 'bonus',
        animated: true,
        label: 'Bonus Triggered'
      },
      {
        id: 'edge-win-idle',
        source: 'win',
        target: 'idle',
        animated: true,
        label: 'Continue'
      },
      {
        id: 'edge-nowin-idle',
        source: 'no-win',
        target: 'idle',
        animated: true
      },
      {
        id: 'edge-bonus-idle',
        source: 'bonus',
        target: 'idle',
        animated: true,
        label: 'Bonus Complete'
      }
    ],
    metadata: {
      name: 'Sample Slot Game Flow',
      description: 'A demonstration of a typical slot game state machine'
    }
  };
}