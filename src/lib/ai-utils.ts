// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildSongBrief(order: any): string {
  const genres = order.genres ? (() => {
    try { return JSON.parse(order.genres).join(', '); } catch { return order.genres; }
  })() : 'Not specified';

  return [
    `Song Brief for ${order.recName || 'Unknown'}`,
    `Occasion: ${order.occasion || 'Not specified'}`,
    `Relationship: ${order.relationship || 'Not specified'}`,
    `Mood: ${order.mood || 'Not specified'}`,
    `Genre: ${genres}`,
    `Language: ${order.language || 'en'}`,
    `Vocal: ${order.vocal || 'Not specified'}`,
    '',
    'Story:',
    `- How they met: ${order.howMet || 'Not provided'}`,
    `- Key memories: ${order.memories || 'Not provided'}`,
    `- What they love: ${order.loveAbout || 'Not provided'}`,
    `- Desired feeling: ${order.feeling || 'Not provided'}`,
    `- One key line: ${order.oneLine || 'Not provided'}`,
    '',
    `Must include: ${order.mustInclude || 'None'}`,
    `Catchphrase: ${order.catchphrase || 'None'}`,
    `Avoid: ${order.avoid || 'None'}`,
    `References: ${order.songReferences || 'None'}`,
    `Lyric tone: ${order.lyricTone || 'Not specified'}`,
  ].join('\n');
}
