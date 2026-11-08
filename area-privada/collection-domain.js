/* Pure collection selection logic shared by the prototype and the handoff. */
((root) => {
  'use strict';

  const dateLimits = { today: 1, week: 7, month: 30 };
  const normalizeSearch = (value) => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');

  /**
   * Selects obtained cards without mutating the input. `daysAgo` belongs
   * to the demo fixture; production derives it from an obtainedAt date.
   */
  function filterCollection(players, state) {
    const query = normalizeSearch(state.q?.trim());
    const limit = dateLimits[state.date] ?? Infinity;
    return players.filter((player) =>
      player.copies > 0 &&
      (!state.selectedPlayer || player.id === state.selectedPlayer) &&
      (!query || normalizeSearch(`${player.name} ${player.label}`).includes(query)) &&
      (!state.club || player.clubKey === state.club) &&
      (!state.positions?.length || state.positions.includes(player.position)) &&
      (!state.gold || player.type === 'gold') &&
      (!state.available || player.available > 0) &&
      (state.date === 'all' || player.daysAgo < limit)
    ).sort((a, b) => state.sort === 'name'
      ? a.name.localeCompare(b.name, 'es')
      : a.daysAgo - b.daysAgo);
  }

  const api = Object.freeze({ filterCollection, normalizeSearch });
  root.CollectionDomain = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
