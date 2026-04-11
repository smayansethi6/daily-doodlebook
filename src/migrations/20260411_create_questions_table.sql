
create extension if not exists "pgcrypto";

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  category text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table questions enable row level security;

create policy "Allow anonymous select" on questions
  for select
  to public
  using (auth.role() = 'anon');

create policy "Allow anonymous insert" on questions
  for insert
  to public
  with check (auth.role() = 'anon');

create policy "Allow anonymous update" on questions
  for update
  to public
  using (auth.role() = 'anon')
  with check (auth.role() = 'anon');

create policy "Allow anonymous delete" on questions
  for delete
  to public
  using (auth.role() = 'anon');

insert into questions (question, category)
  select q->>'question', q->>'category'
  from jsonb_array_elements($$
[
  {
    "question": "Do you think you're the same person you were 10 years ago?",
    "category": "Self & Identity"
  },
  {
    "question": "If your memories were erased, would you still be 'you'?",
    "category": "Self & Identity"
  },
  {
    "question": "Do you choose who you are, or does life choose for you?",
    "category": "Self & Identity"
  },
  {
    "question": "Are you the voice in your head, or the one listening to it?",
    "category": "Self & Identity"
  },
  {
    "question": "How much of your personality is really 'yours' vs copied from others?",
    "category": "Self & Identity"
  },
  {
    "question": "Do you think people can truly change who they are?",
    "category": "Self & Identity"
  },
  {
    "question": "If you woke up in someone else's body tomorrow, what would you miss most?",
    "category": "Self & Identity"
  },
  {
    "question": "Are you more afraid of being misunderstood or of never trying to be understood?",
    "category": "Self & Identity"
  },
  {
    "question": "Is there a version of yourself you're hiding from the world?",
    "category": "Self & Identity"
  },
  {
    "question": "If you could read your own mind honestly, would you like what you see?",
    "category": "Self & Identity"
  },
  {
    "question": "Do you think your inner voice is kind to you?",
    "category": "Self & Identity"
  },
  {
    "question": "When you say 'I need space', what are you really asking for?",
    "category": "Self & Identity"
  },
  {
    "question": "Is loneliness always bad, or can it be a kind of freedom?",
    "category": "Self & Identity"
  },
  {
    "question": "Do you feel more like the author of your life or a character in it?",
    "category": "Self & Identity"
  },
  {
    "question": "Can you love yourself without fully knowing yourself?",
    "category": "Self & Identity"
  },
  {
    "question": "Is it possible to be honest with others if you're not honest with yourself?",
    "category": "Self & Identity"
  },
  {
    "question": "Are you living the life you chose, or the life that was expected of you?",
    "category": "Self & Identity"
  },
  {
    "question": "What part of yourself do you find hardest to accept?",
    "category": "Self & Identity"
  },
  {
    "question": "If you could erase one thing from your past, should you?",
    "category": "Self & Identity"
  },
  {
    "question": "Do you think you're fundamentally different when no one's watching?",
    "category": "Self & Identity"
  },
  {
    "question": "Is growing older the same as growing up?",
    "category": "Self & Identity"
  },
  {
    "question": "Do you think you're capable of truly surprising yourself?",
    "category": "Self & Identity"
  },
  {
    "question": "Is self-awareness a gift or a burden?",
    "category": "Self & Identity"
  },
  {
    "question": "How much of who you are is shaped by fear?",
    "category": "Self & Identity"
  },
  {
    "question": "Can you be truly yourself around other people, or only when you're alone?",
    "category": "Self & Identity"
  },
  {
    "question": "Is it possible to do the right thing for the wrong reason?",
    "category": "Ethics"
  },
  {
    "question": "If no one ever found out, would it still be wrong?",
    "category": "Ethics"
  },
  {
    "question": "Do you think people are basically good, or do they have to be taught to be good?",
    "category": "Ethics"
  },
  {
    "question": "Can a bad person do a good thing — or a good person do a bad thing?",
    "category": "Ethics"
  },
  {
    "question": "Is it ever okay to lie to protect someone?",
    "category": "Ethics"
  },
  {
    "question": "Should you help a stranger before helping someone you love?",
    "category": "Ethics"
  },
  {
    "question": "If stealing food to feed your family is wrong, what makes it wrong?",
    "category": "Ethics"
  },
  {
    "question": "Does forgiving someone mean what they did was okay?",
    "category": "Ethics"
  },
  {
    "question": "Is it more important to be kind or to be honest?",
    "category": "Ethics"
  },
  {
    "question": "Do you have any responsibilities to people you've never met?",
    "category": "Ethics"
  },
  {
    "question": "Can you judge a person's whole life by their worst moment?",
    "category": "Ethics"
  },
  {
    "question": "Is it wrong to stay silent when you know something is unjust?",
    "category": "Ethics"
  },
  {
    "question": "Does someone deserve punishment even if they won't do the wrong thing again?",
    "category": "Ethics"
  },
  {
    "question": "Is there such a thing as a victimless crime?",
    "category": "Ethics"
  },
  {
    "question": "Are your intentions more important than the outcomes of your actions?",
    "category": "Ethics"
  },
  {
    "question": "Is it worse to hurt someone by doing something, or by doing nothing?",
    "category": "Ethics"
  },
  {
    "question": "Should animals have the same rights as people?",
    "category": "Ethics"
  },
  {
    "question": "Can something be legal and still be deeply wrong?",
    "category": "Ethics"
  },
  {
    "question": "Do you think revenge ever leads to real justice?",
    "category": "Ethics"
  },
  {
    "question": "Is it ethical to eat meat if you could survive without it?",
    "category": "Ethics"
  },
  {
    "question": "Should you follow a rule you think is unjust, just because it's a rule?",
    "category": "Ethics"
  },
  {
    "question": "Is there a universal right and wrong, or does it depend on where you're from?",
    "category": "Ethics"
  },
  {
    "question": "Can you respect someone you deeply disagree with?",
    "category": "Ethics"
  },
  {
    "question": "What do you owe the people who raised you?",
    "category": "Ethics"
  },
  {
    "question": "If you could save five strangers or one person you love, which would you choose?",
    "category": "Ethics"
  },
  {
    "question": "What's the difference between pleasure and happiness?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Can you be happy and still feel like something is missing?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Is it possible to be content without being happy?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "If you could feel happy all the time, would you want to?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Does having more choices make life better or more stressful?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Do you think happiness is something you find or something you build?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Is a simple life with few desires happier than an ambitious one?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Can you be truly happy if the people you love are suffering?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "What's one thing most people chase that won't actually make them happy?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Is happiness a feeling, a choice, or a habit?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Do you need other people to be truly happy, or can you do it alone?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Would you trade 10 years of your life for a decade of perfect happiness?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Is it selfish to prioritize your own happiness?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Can suffering make you happier in the long run?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "What's the last thing that made you feel truly alive?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Is it possible to be both grateful and unhappy at the same time?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Does your idea of a good life match how you're actually living?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Is boredom a sign of a problem, or a natural part of life?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Is a life without regret even possible — or desirable?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Can wealth buy the conditions for happiness without buying happiness itself?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Would you rather have a long average life or a short extraordinary one?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Is peace of mind more valuable than excitement?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Do you think people know what makes them happy before they experience it?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "What would your life look like if fear wasn't holding you back?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "Is happiness a destination or the journey itself?",
    "category": "Happiness & the Good Life"
  },
  {
    "question": "How do you know the world exists when you're not looking at it?",
    "category": "Reality & Existence"
  },
  {
    "question": "Could life be a simulation — and would it matter if it was?",
    "category": "Reality & Existence"
  },
  {
    "question": "Is everything that exists physical, or is there more to reality?",
    "category": "Reality & Existence"
  },
  {
    "question": "Do numbers exist, or did humans just invent them?",
    "category": "Reality & Existence"
  },
  {
    "question": "If a tree falls and no one hears it, does it make a sound?",
    "category": "Reality & Existence"
  },
  {
    "question": "Is there anything that exists outside of someone's mind?",
    "category": "Reality & Existence"
  },
  {
    "question": "Could there be colors that humans are incapable of seeing or imagining?",
    "category": "Reality & Existence"
  },
  {
    "question": "Are the rules of nature permanent, or could they change?",
    "category": "Reality & Existence"
  },
  {
    "question": "Is time real, or just a story we tell ourselves?",
    "category": "Reality & Existence"
  },
  {
    "question": "Does the universe have a purpose, or is it just there?",
    "category": "Reality & Existence"
  },
  {
    "question": "Is consciousness special, or just a really complex process?",
    "category": "Reality & Existence"
  },
  {
    "question": "Could there be other universes we can never reach or see?",
    "category": "Reality & Existence"
  },
  {
    "question": "Are beauty and ugliness in the world, or only in our heads?",
    "category": "Reality & Existence"
  },
  {
    "question": "If we can't prove something, does that mean it doesn't exist?",
    "category": "Reality & Existence"
  },
  {
    "question": "What's more real — the physical world or your inner life?",
    "category": "Reality & Existence"
  },
  {
    "question": "Is there such a thing as pure chance, or does everything have a cause?",
    "category": "Reality & Existence"
  },
  {
    "question": "Can something come from nothing?",
    "category": "Reality & Existence"
  },
  {
    "question": "Are laws of logic invented or discovered?",
    "category": "Reality & Existence"
  },
  {
    "question": "Do objects exist between moments you observe them?",
    "category": "Reality & Existence"
  },
  {
    "question": "Is the self just another story the brain tells itself?",
    "category": "Reality & Existence"
  },
  {
    "question": "If reality is different for everyone, is there a shared reality at all?",
    "category": "Reality & Existence"
  },
  {
    "question": "Is infinity real, or just a concept we use when we run out of answers?",
    "category": "Reality & Existence"
  },
  {
    "question": "What would it mean for something to be truly impossible?",
    "category": "Reality & Existence"
  },
  {
    "question": "Could two completely contradictory things both be true at the same time?",
    "category": "Reality & Existence"
  },
  {
    "question": "Is there something rather than nothing — and why?",
    "category": "Reality & Existence"
  },
  {
    "question": "Do we have a duty to help people we've never met, even in other countries?",
    "category": "Society & Other People"
  },
  {
    "question": "Is inequality natural, or is it a choice society keeps making?",
    "category": "Society & Other People"
  },
  {
    "question": "Would you be a different person if you were born in a different country?",
    "category": "Society & Other People"
  },
  {
    "question": "Are laws meant to reflect morality, or just keep order?",
    "category": "Society & Other People"
  },
  {
    "question": "Is it possible to be truly free in a society?",
    "category": "Society & Other People"
  },
  {
    "question": "Do social media platforms make us more connected or more alone?",
    "category": "Society & Other People"
  },
  {
    "question": "Should everyone follow the majority's decision even when they disagree?",
    "category": "Society & Other People"
  },
  {
    "question": "Is it possible for a society to be genuinely fair?",
    "category": "Society & Other People"
  },
  {
    "question": "Does the way you dress affect how people perceive your intelligence?",
    "category": "Society & Other People"
  },
  {
    "question": "Can you truly understand someone from a very different background?",
    "category": "Society & Other People"
  },
  {
    "question": "Is fame ever deserved, or is it always partly luck?",
    "category": "Society & Other People"
  },
  {
    "question": "Do people who grow up in poverty have less freedom than those who don't?",
    "category": "Society & Other People"
  },
  {
    "question": "Is cancel culture a form of justice or a form of mob rule?",
    "category": "Society & Other People"
  },
  {
    "question": "Should the majority get to decide what's acceptable for everyone?",
    "category": "Society & Other People"
  },
  {
    "question": "Is it possible to be truly unbiased?",
    "category": "Society & Other People"
  },
  {
    "question": "Does social media give everyone a voice, or just amplify the loudest?",
    "category": "Society & Other People"
  },
  {
    "question": "Are people fundamentally the same across cultures, or more different than we admit?",
    "category": "Society & Other People"
  },
  {
    "question": "Is it the job of government to make people happy, or just to keep them safe?",
    "category": "Society & Other People"
  },
  {
    "question": "Would people be more moral without religion, or less?",
    "category": "Society & Other People"
  },
  {
    "question": "Can you be patriotic and still criticize your country?",
    "category": "Society & Other People"
  },
  {
    "question": "Is privacy a right or a luxury that depends on your circumstances?",
    "category": "Society & Other People"
  },
  {
    "question": "Are the poor responsible for their own poverty?",
    "category": "Society & Other People"
  },
  {
    "question": "Does art have a responsibility to society, or just to the artist?",
    "category": "Society & Other People"
  },
  {
    "question": "Can war ever be fully justified?",
    "category": "Society & Other People"
  },
  {
    "question": "Is it possible for a society to run without leaders?",
    "category": "Society & Other People"
  },
  {
    "question": "Does life need a purpose, or can it just be lived?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Can you create your own meaning in a universe that has none?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Is it possible to live a meaningful life without suffering?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Does what you do for work have to mean something for your life to be meaningful?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "If no one remembered you after you died, would your life have still mattered?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Do you have to believe in something bigger than yourself to feel meaning?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Is doing good meaningful if you don't feel anything while doing it?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Can meaningless tasks still be part of a meaningful life?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "What would make you feel like your life was well-lived?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Is purpose something you discover or something you decide?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Does having children automatically give life more meaning?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Can a moment be meaningful even if no one knows it happened?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Is it okay to live without a clear sense of purpose?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "What would you regret not doing on your deathbed?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Does helping others give you meaning, or just a feeling of meaning?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Can a tragic life still be a meaningful one?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Is the search for meaning itself the point, not finding it?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Would you live differently if you knew exactly when you'd die?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Is meaning the same as happiness, or are they different things?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Does a person's life have less meaning if they never leave their hometown?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Can art give life more meaning than relationships?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Is it more meaningful to be remembered by many or deeply loved by a few?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Can routine ever be meaningful, or does meaning require novelty?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Is meaning found in the moments you're present for, or in what you leave behind?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Does life have to make sense to be worth living?",
    "category": "Meaning & Purpose"
  },
  {
    "question": "Do you think the past is fixed, or does our understanding of it change?",
    "category": "Time & Change"
  },
  {
    "question": "If you could go back and change one decision, should you?",
    "category": "Time & Change"
  },
  {
    "question": "Is nostalgia a form of grief, or a form of gratitude?",
    "category": "Time & Change"
  },
  {
    "question": "Does time feel the same to everyone, or is it personal?",
    "category": "Time & Change"
  },
  {
    "question": "Why does time seem to speed up as we get older?",
    "category": "Time & Change"
  },
  {
    "question": "Is the present moment all that exists, or is the past equally real?",
    "category": "Time & Change"
  },
  {
    "question": "Can regret teach you something, or does it just slow you down?",
    "category": "Time & Change"
  },
  {
    "question": "Are we the same person across time, or a series of different people?",
    "category": "Time & Change"
  },
  {
    "question": "Does knowing something ends make you appreciate it more?",
    "category": "Time & Change"
  },
  {
    "question": "Is the future something you create, or something you discover?",
    "category": "Time & Change"
  },
  {
    "question": "Would you want to live forever if it meant watching everyone you love die?",
    "category": "Time & Change"
  },
  {
    "question": "Is progress always good, or can moving forward mean losing something important?",
    "category": "Time & Change"
  },
  {
    "question": "Should you spend more time looking back, or looking forward?",
    "category": "Time & Change"
  },
  {
    "question": "Can two people experience the same moment completely differently?",
    "category": "Time & Change"
  },
  {
    "question": "Is it possible to truly let go of the past?",
    "category": "Time & Change"
  },
  {
    "question": "Does the fear of death make you live more fully, or less?",
    "category": "Time & Change"
  },
  {
    "question": "Is change always growth, or can growth sometimes mean staying the same?",
    "category": "Time & Change"
  },
  {
    "question": "Would you rather know your future, or be surprised by it?",
    "category": "Time & Change"
  },
  {
    "question": "Do you think humanity is getting better over time, or just different?",
    "category": "Time & Change"
  },
  {
    "question": "Is patience a virtue, or just delayed dissatisfaction?",
    "category": "Time & Change"
  },
  {
    "question": "Can a moment last forever in memory, even if it only lasted a second?",
    "category": "Time & Change"
  },
  {
    "question": "Is the life you're living now something your past self would be proud of?",
    "category": "Time & Change"
  },
  {
    "question": "Does death give life meaning, or just remind us of its limits?",
    "category": "Time & Change"
  },
  {
    "question": "If you knew today was your last day, how would it change how you lived it?",
    "category": "Time & Change"
  },
  {
    "question": "Is there such a thing as wasted time, or just time spent differently?",
    "category": "Time & Change"
  },
  {
    "question": "Can you ever really know something for certain?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is there a difference between believing something and knowing it?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "If everyone agrees on something, does that make it true?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is a lie that makes someone happier better than a truth that hurts them?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Can you trust your own memory?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is there such a thing as objective truth, or is it always filtered through a perspective?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Can science answer every question that matters?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is ignorance ever bliss, or is knowledge always better?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Do you think humans are even capable of understanding everything about the universe?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is a belief still valid if you can't prove it?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Can two people look at the same evidence and reach completely different conclusions?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is it possible to know yourself better than others know you?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Does the way something is said change whether it's true?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Can art convey truth better than facts can?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is doubt the enemy of knowledge, or part of it?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is there a kind of truth that can't be put into words?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Should you believe something just because most experts say so?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Can you choose what to believe, or does belief just happen?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is there a fact that, if widely known, would change everything?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Does experiencing something give you more knowledge of it than studying it?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is wisdom different from knowledge — and which matters more?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Can you be wrong about something you've believed your whole life?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is the truth always worth knowing, even if it changes nothing?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Can a story be more truthful than a fact?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Is the map ever the territory — do our descriptions shape reality?",
    "category": "Knowledge & Truth"
  },
  {
    "question": "Would you, at all costs, prioritize a human over an infinite amount of animals?",
    "category": "Animal ethics"
  },
  {
    "question": "Do you believe animals can feel pain?",
    "category": "Animal ethics"
  },
  {
    "question": "Do you think that feeling pain is enough justification to treat animals with respect?",
    "category": "Animal ethics"
  },
  {
    "question": "Should we prioritize the people of the future, considering that there are many more generations to come, than the people of the present?",
    "category": "Effective Altruism"
  },
  {
    "question": "Do you believe that there are certain risks that might be there in the future that are greater than climate change, nuclear war or pandemic?",
    "category": "Effective Altruism"
  }
]
$$::jsonb) as q;

create or replace function get_random_question()
returns setof questions as $$
  select * from questions order by random() limit 1;
$$ language sql stable;

