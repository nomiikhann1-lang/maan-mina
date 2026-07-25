const PROMPTS = [
  "What made you smile today?",
  "What's one thing you're grateful for right now?",
  "If we could teleport anywhere for dinner tonight, where would we go?",
  "What song has been stuck in your head lately?",
  "What's a small thing I do that you love?",
  "What are you looking forward to this week?",
  "What's your favorite memory of us from this year?",
  "If today had a color, what would it be?",
  "What's something you learned recently?",
  "Describe your mood right now using only emojis.",
  "What's a food you could eat every day and never get sick of?",
  "What's one thing on your mind you haven't said out loud yet?",
  "What's your favorite thing about today so far?",
  "If we had a free day tomorrow, what would we do?",
  "What's a movie or show we should watch together?",
  "What's something that made you laugh recently?",
  "What's a place you'd love to visit together someday?",
  "What's one word that describes how you're feeling right now?",
  "What's something small I could do to make your day better?",
  "What's a childhood memory that still makes you happy?",
  "What are you proud of yourself for this week?",
  "What's your favorite thing about us?",
  "If you could nap anywhere right now, where would it be?",
  "What's a goal you're working towards right now?",
  "What's something you're curious about lately?",
  "What's the best thing you ate this week?",
  "What's a song that reminds you of me?",
  "What's something you want to tell me but haven't yet?",
  "If we could have any pet, what would it be?",
  "What's one thing you're excited about for our future?",
];

/** Same day → same prompt for both of you, based on the local calendar date. */
export function getTodaysPrompt(date: Date = new Date()): string {
  const dayOfYear = Math.floor(
    (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
      Date.UTC(date.getFullYear(), 0, 0)) /
      86400000,
  );
  return PROMPTS[dayOfYear % PROMPTS.length];
}

export function todaysPromptDismissedKey(date: Date = new Date()): string {
  return `daily_prompt_dismissed_${date.toISOString().slice(0, 10)}`;
}
