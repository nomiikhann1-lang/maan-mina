export function greetingFor(name: string) {
  const h = new Date().getHours();
  if (h < 5) return { emoji: "🌙", text: `Still awake, ${name}?` };
  if (h < 12) return { emoji: "🌞", text: `Good morning, ${name}` };
  if (h < 17) return { emoji: "🌻", text: `Sunny afternoon, ${name}` };
  if (h < 21) return { emoji: "🌇", text: `Good evening, ${name}` };
  return { emoji: "🌙", text: `Good night, ${name}` };
}
