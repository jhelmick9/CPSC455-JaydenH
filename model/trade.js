const categorySet = new Set(['modern', 'vintage']);
const trades = [
  {
    id: '1',
    name: 'Mike Trout',
    category: 'modern',
    details: 'Center field card in excellent shape.',
    team: 'Angels',
    year: 2019,
    condition: '8.5',
    image: '/MikeT1.webp',
    status: 'Available'
  },
  {
    id: '2',
    name: 'Bryce Harper',
    category: 'modern',
    details: 'Signed card with minor edge wear.',
    team: 'Phillies',
    year: 2020,
    condition: '7.0',
    image: '/BryceH1.jpg',
    status: 'Available'
  },
  {
    id: '3',
    name: 'Shohei Ohtani',
    category: 'modern',
    details: 'Dual-threat feature card, sharp corners.',
    team: 'Angels',
    year: 2021,
    condition: '8.0',
    image: '/ShoheiO1.webp',
    status: 'Available'
  },
  {
    id: '4',
    name: 'Ken Griffey Jr.',
    category: 'vintage',
    details: 'Classic Mariners-era card.',
    team: 'Mariners',
    year: 1991,
    condition: '9.5',
    image: '/KenG1.jpg',
    status: 'Available'
  },
  {
    id: '5',
    name: 'Nolan Ryan',
    category: 'vintage',
    details: 'Hall of Fame pitcher card.',
    team: 'Rangers',
    year: 1989,
    condition: '5.0',
    image: '/NolanR1.jpg',
    status: 'Available'
  },
  {
    id: '6',
    name: 'Cal Ripken Jr.',
    category: 'vintage',
    details: 'Iron Man collector card.',
    team: 'Orioles',
    year: 1990,
    condition: '6.0',
    image: '/CalR1.jpg',
    status: 'Available'
  }
];

exports.create = (newTrade) => {
  const id = String(trades.length ? Number.parseInt(trades[trades.length - 1].id) + 1 : 1);
  const created = Object.assign({ id }, newTrade);
  trades.push(created);
  if (created.category) {
    categorySet.add(created.category);
  }
  return created;
};

exports.findById = (id) => {
  return trades.find((t) => t.id === id);
};

exports.findByCategory = (category) => {
  return trades.filter((t) => t.category === category);
};

exports.findCategories = () => {
  return Array.from(categorySet);
};

exports.findAll = () => {
  return trades;
};

exports.updateById = (id, trade) => {
  const idx = trades.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  trades[idx] = Object.assign({}, trades[idx], trade);
  return trades[idx];
};

exports.deleteById = (id) => {
  const idx = trades.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  return trades.splice(idx, 1)[0];
};

exports.save = exports.create;
exports.findTrades = exports.findAll;

