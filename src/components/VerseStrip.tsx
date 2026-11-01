export function VerseStrip() {
  return (
    <section className="border-y border-gold-400/40 bg-gradient-to-r from-parish-600 via-parish-500 to-parish-600 py-10 text-center text-white">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-300">Versículo do dia</p>
      <blockquote className="mx-auto mt-4 max-w-3xl font-[family-name:var(--font-display)] text-2xl font-medium leading-snug md:text-3xl">
        “Eu sou o Alfa e o Ômega, diz o Senhor Deus, aquele que é, que era e que vem, o
        Todo-Poderoso.”
      </blockquote>
      <cite className="mt-4 block text-sm font-semibold not-italic text-gold-300">
        Apocalipse 1,8
      </cite>
    </section>
  );
}
