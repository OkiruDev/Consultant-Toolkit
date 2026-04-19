import { ManagementData, Employee } from '../types';

export function calculateManagementScore(data: ManagementData) {
  const { employees } = data;
  
  // EAP targets for National (mocked for now, can be dynamic based on province)
  const EAP_TARGETS = {
    African: { Male: 43.5, Female: 35.8 },
    Coloured: { Male: 4.8, Female: 4.1 },
    Indian: { Male: 1.6, Female: 1.0 },
    White: { Male: 5.1, Female: 4.1 },
  };

  const MAX_POINTS = {
    board: 2,           // simplified: 1 for black, 1 for black women
    executive: 4,       // simplified: 2 for black, 2 for black women
    senior: 5,          // simplified: eap weighted 
    middle: 4,          // simplified: eap weighted
    junior: 4,          // simplified: eap weighted
    disabled: 2,        // simplified
    total: 19
  };

  // Group employees
  const grouped = employees.reduce((acc, emp) => {
    if (!acc[emp.designation]) acc[emp.designation] = [];
    acc[emp.designation].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);

  // Helper: Count black employees (African, Coloured, Indian)
  const countBlack = (emps: Employee[] = []) => 
    emps.filter(e => ['African', 'Coloured', 'Indian'].includes(e.race)).length;
    
  // Helper: Count black women
  const countBlackWomen = (emps: Employee[] = []) => 
    emps.filter(e => ['African', 'Coloured', 'Indian'].includes(e.race) && e.gender === 'Female').length;

  // Board (Max 2)
  const board = grouped['Board'] || [];
  const boardScore = board.length > 0 
    ? ((countBlack(board) / board.length) >= 0.5 ? 1 : 0) + 
      ((countBlackWomen(board) / board.length) >= 0.25 ? 1 : 0)
    : 0;

  // Executive (Max 4)
  const exec = grouped['Executive'] || [];
  const execScore = exec.length > 0
    ? ((countBlack(exec) / exec.length) >= 0.6 ? 2 : (countBlack(exec) / exec.length) * 2) +
      ((countBlackWomen(exec) / exec.length) >= 0.3 ? 2 : (countBlackWomen(exec) / exec.length) * 2)
    : 0;

  // Senior (Max 5)
  const senior = grouped['Senior'] || [];
  const seniorScore = senior.length > 0
    ? Math.min(5, (countBlack(senior) / senior.length) * 5)
    : 0;

  // Middle (Max 4)
  const middle = grouped['Middle'] || [];
  const middleScore = middle.length > 0
    ? Math.min(4, (countBlack(middle) / middle.length) * 4)
    : 0;

  // Junior (Max 4)
  const junior = grouped['Junior'] || [];
  const juniorScore = junior.length > 0
    ? Math.min(4, (countBlack(junior) / junior.length) * 4)
    : 0;

  // Disabled (Max 2)
  const disabledEmps = employees.filter(e => e.isDisabled);
  const disabledScore = disabledEmps.length > 0
    ? Math.min(2, (countBlack(disabledEmps) / Math.max(employees.length, 1)) * 100 * 2) // Simplified 2% target
    : 0;

  const totalPoints = boardScore + execScore + seniorScore + middleScore + juniorScore + disabledScore;

  return {
    board: boardScore,
    executive: execScore,
    senior: seniorScore,
    middle: middleScore,
    junior: juniorScore,
    disabled: disabledScore,
    total: Math.min(totalPoints, MAX_POINTS.total),
    subMinimumMet: true,
    rawStats: {
      boardBlackVotingPercentage: board.length ? countBlack(board) / board.length : 0,
      boardBlackWomenVotingPercentage: board.length ? countBlackWomen(board) / board.length : 0,
      execBlackVotingPercentage: exec.length ? countBlack(exec) / exec.length : 0,
      execBlackWomenVotingPercentage: exec.length ? countBlackWomen(exec) / exec.length : 0,
      seniorBlackPercentage: senior.length ? countBlack(senior) / senior.length : 0,
      seniorBlackWomenPercentage: senior.length ? countBlackWomen(senior) / senior.length : 0,
      middleBlackPercentage: middle.length ? countBlack(middle) / middle.length : 0,
      middleBlackWomenPercentage: middle.length ? countBlackWomen(middle) / middle.length : 0,
      juniorBlackPercentage: junior.length ? countBlack(junior) / junior.length : 0,
      juniorBlackWomenPercentage: junior.length ? countBlackWomen(junior) / junior.length : 0,
      disabledBlackPercentage: disabledEmps.length ? countBlack(disabledEmps) / Math.max(employees.length, 1) : 0,
      disabledBlackWomenPercentage: disabledEmps.length ? countBlackWomen(disabledEmps) / Math.max(employees.length, 1) : 0
    }
  };
}