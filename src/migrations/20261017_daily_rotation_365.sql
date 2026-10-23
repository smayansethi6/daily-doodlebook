-- ThinkPhil 365: one statement a day, the same one for every visitor.
--
-- The 365 statements form a numbered rotation. Number 1 is served on the day
-- this migration runs (Dubai time, when ThinkPhil's day turns over), number 2
-- the next day, and after 365 the rotation starts again at 1. A row in
-- question_schedules puts its question on that date instead; the rotation
-- statement it displaces comes round again next cycle. Questions without a
-- rotation_position appear only on dates they are scheduled for.
--
-- Safe to run more than once.
--
-- To start the rotation on a different day, run in the SQL editor:
--   update question_rotation set starts_on = '2026-11-01';

alter table questions
  add column if not exists rotation_position integer;

create unique index if not exists questions_rotation_position_key
  on questions (rotation_position);

-- A single row: the day rotation_position 1 was (or will be) served.
create table if not exists question_rotation (
  id boolean primary key default true check (id),
  starts_on date not null
);

-- No policies: only the functions below read it.
alter table question_rotation enable row level security;

insert into question_rotation (starts_on)
values (timezone('Asia/Dubai', now())::date)
on conflict (id) do nothing;

-- The question everyone gets on p_date. A scheduled question wins (the one
-- scheduled first, if several share a date); otherwise the rotation decides. Never random, so every visitor sees the same question all day.
create or replace function question_id_for_date(p_date date)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_question_id uuid;
  v_starts_on date;
  v_total integer;
begin
  select qs.question_id into v_question_id
  from question_schedules qs
  where qs.scheduled_date = p_date
  order by qs.created_at, qs.id
  limit 1;

  if v_question_id is not null then
    return v_question_id;
  end if;

  select count(*) into v_total from questions where rotation_position is not null;

  if v_total > 0 then
    select starts_on into v_starts_on from question_rotation;

    select q.id into v_question_id
    from questions q
    where q.rotation_position is not null
    order by q.rotation_position
    offset mod(mod(p_date - coalesce(v_starts_on, date '2026-01-01'), v_total) + v_total, v_total)
    limit 1;

    return v_question_id;
  end if;

  -- With the rotation emptied, still give every visitor the same question each
  -- day by stepping through all questions, oldest first.
  select count(*) into v_total from questions;
  if v_total = 0 then
    return null;
  end if;

  select q.id into v_question_id
  from questions q
  order by q.created_at, q.id
  offset mod(mod(p_date - date '2026-01-01', v_total) + v_total, v_total)
  limit 1;

  return v_question_id;
end;
$$;

-- Replaces the earlier version, which chose at random and so could show two
-- visitors different questions on the same day.
create or replace function get_daily_question(
  target_date date default timezone('Asia/Dubai', now())::date
)
returns setof questions
language sql
stable
set search_path = public
as $$
  select q.* from questions q where q.id = question_id_for_date(target_date);
$$;

revoke all on function question_id_for_date(date) from public;
grant execute on function question_id_for_date(date) to anon, authenticated;

-- The ThinkPhil 365, numbered as in the source list. Statements suit the
-- default agree / disagree scale, so stance settings keep their defaults.
insert into questions (question, category, rotation_position)
select s.question, s.category, s.n
from jsonb_to_recordset($$
[
{"n": 1, "category": "Ethics", "question": "It is wrong to lie, even to protect someone's feelings."},
{"n": 2, "category": "Politics & Justice", "question": "Without government, people would quickly turn on each other."},
{"n": 3, "category": "Meaning & Mortality", "question": "Life has no meaning except the meaning we give it."},
{"n": 4, "category": "Happiness & the Good Life", "question": "Happiness is the ultimate goal behind everything we do."},
{"n": 5, "category": "Mind & Consciousness", "question": "The mind is something separate from the body and brain."},
{"n": 6, "category": "Knowledge & Truth", "question": "The only thing you can be completely certain of is that you exist."},
{"n": 7, "category": "Technology & the Future", "question": "Technology is neutral; only how we use it is good or bad."},
{"n": 8, "category": "Reality & Existence", "question": "If every part of a ship is gradually replaced, it is still the same ship."},
{"n": 9, "category": "God & Religion", "question": "The universe must have a first cause, which we can call God."},
{"n": 10, "category": "Free Will & Responsibility", "question": "Every choice you make was fully determined by what came before it."},
{"n": 11, "category": "Art & Beauty", "question": "Beauty is entirely in the eye of the beholder."},
{"n": 12, "category": "Language & Logic", "question": "Words get their meaning from how people use them, not from dictionary definitions."},
{"n": 13, "category": "Love & Friendship", "question": "Love is a choice and a skill, not just a feeling."},
{"n": 14, "category": "Society & Culture", "question": "Humans are by nature social and political animals."},
{"n": 15, "category": "Ethics", "question": "The right action is whichever one creates the most happiness for the most people."},
{"n": 16, "category": "Society & Culture", "question": "Humans are naturally good; it is society that corrupts them."},
{"n": 17, "category": "Meaning & Mortality", "question": "Life is absurd, and we should embrace it anyway."},
{"n": 18, "category": "Happiness & the Good Life", "question": "Pleasure is the only thing that is good in itself."},
{"n": 19, "category": "Mind & Consciousness", "question": "Your thoughts and feelings are nothing more than activity in your brain."},
{"n": 20, "category": "Knowledge & Truth", "question": "We cannot prove we are not living in a computer simulation."},
{"n": 21, "category": "Ethics", "question": "If you could save five people by pulling a lever that kills one person instead, you should pull it."},
{"n": 22, "category": "Technology & the Future", "question": "Humans should use technology to enhance their bodies and minds beyond normal limits."},
{"n": 23, "category": "Self & Identity", "question": "You are the same person you were at age five."},
{"n": 24, "category": "Politics & Justice", "question": "A fair society is one you would choose if you didn't know whether you'd be born rich or poor."},
{"n": 25, "category": "God & Religion", "question": "The complexity of living things is evidence of a designer."},
{"n": 26, "category": "Free Will & Responsibility", "question": "Nobody can be truly responsible for what they do, since nobody created themselves."},
{"n": 27, "category": "Art & Beauty", "question": "Some people's taste in art is genuinely better than others'."},
{"n": 28, "category": "Language & Logic", "question": "Some of the most important things can't be said, only shown."},
{"n": 29, "category": "Love & Friendship", "question": "Romantic love is a search for our missing other half."},
{"n": 30, "category": "Politics & Justice", "question": "We should tolerate opinions and religions we believe are wrong."},
{"n": 31, "category": "Ethics", "question": "Pushing one person off a bridge to stop a train from killing five is just as acceptable as pulling a lever to divert it."},
{"n": 32, "category": "Happiness & the Good Life", "question": "A repetitive, seemingly pointless task can still be part of a happy life."},
{"n": 33, "category": "Happiness & the Good Life", "question": "Simple pleasures lead to a happier life than luxury."},
{"n": 34, "category": "Mind & Consciousness", "question": "A scientist who knew every physical fact about colour but had never seen colour would learn something new on seeing red."},
{"n": 35, "category": "Knowledge & Truth", "question": "If you believe something true for good reasons, you know it."},
{"n": 36, "category": "Politics & Justice", "question": "Taxing people's earnings to help others is a form of forced labour."},
{"n": 37, "category": "Technology & the Future", "question": "Parents should be allowed to choose their children's genetic traits."},
{"n": 38, "category": "Self & Identity", "question": "A teleporter that destroys you and builds an exact copy elsewhere is a way of travelling, not dying."},
{"n": 39, "category": "Ethics", "question": "People in wealthy countries are morally obliged to give a large part of their income to help the world's poorest."},
{"n": 40, "category": "God & Religion", "question": "The amount of suffering in the world shows there is no all-good, all-powerful God."},
{"n": 41, "category": "Politics & Justice", "question": "Inequality is acceptable as long as it makes the poorest people better off."},
{"n": 42, "category": "Meaning & Mortality", "question": "If you had to relive your life exactly the same way forever, you would welcome it."},
{"n": 43, "category": "Happiness & the Good Life", "question": "A good person can be happy even when poor, sick, or in pain."},
{"n": 44, "category": "Mind & Consciousness", "question": "We can never truly know what it is like to be another kind of creature, like a bat."},
{"n": 45, "category": "Free Will & Responsibility", "question": "Free will can exist even if everything is determined."},
{"n": 46, "category": "Knowledge & Truth", "question": "The fact that the sun has always risen doesn't prove it will rise tomorrow."},
{"n": 47, "category": "Art & Beauty", "question": "Art should be judged by its moral message."},
{"n": 48, "category": "Language & Logic", "question": "A statement that can't be checked by observation or logic is meaningless."},
{"n": 49, "category": "Ethics", "question": "A child dying far away matters just as much as a child drowning right in front of you."},
{"n": 50, "category": "Love & Friendship", "question": "We love people for who they are, not for their qualities."},
{"n": 51, "category": "Politics & Justice", "question": "A tolerant society should not tolerate the intolerant."},
{"n": 52, "category": "Technology & the Future", "question": "We should slow down the development of advanced AI until we know it's safe."},
{"n": 53, "category": "Politics & Justice", "question": "The government should never stop adults from doing things that only harm themselves."},
{"n": 54, "category": "Self & Identity", "question": "What matters is not whether 'you' survive, but whether your memories and character continue."},
{"n": 55, "category": "God & Religion", "question": "Believing in God is a smart bet, even without proof."},
{"n": 56, "category": "Ethics", "question": "Right and wrong are simply what each culture decides; no culture's morals are better than another's."},
{"n": 57, "category": "Meaning & Mortality", "question": "Death is nothing to fear, because when it comes we no longer exist to experience it."},
{"n": 58, "category": "Happiness & the Good Life", "question": "It is not events that upset us, but our judgements about them."},
{"n": 59, "category": "Mind & Consciousness", "question": "A computer that can perfectly follow rules for answering questions in Chinese still doesn't understand Chinese."},
{"n": 60, "category": "Knowledge & Truth", "question": "An idea is true if it works in practice."},
{"n": 61, "category": "Politics & Justice", "question": "Free speech should protect even offensive or hateful opinions."},
{"n": 62, "category": "Free Will & Responsibility", "question": "If scientists could predict your decisions before you're aware of them, you wouldn't have free will."},
{"n": 63, "category": "Art & Beauty", "question": "A work can be morally offensive and still be great art."},
{"n": 64, "category": "Language & Logic", "question": "Saying something can be a way of doing something, like promising or apologising."},
{"n": 65, "category": "Ethics", "question": "Having good character matters more than following moral rules."},
{"n": 66, "category": "Technology & the Future", "question": "Reducing the risk of human extinction should be one of humanity's top priorities."},
{"n": 67, "category": "Love & Friendship", "question": "Lifelong monogamy is natural for humans."},
{"n": 68, "category": "Self & Identity", "question": "Our sense of who we are depends heavily on how others recognise us."},
{"n": 69, "category": "Reality & Existence", "question": "You cannot step into the same river twice."},
{"n": 70, "category": "Meaning & Mortality", "question": "Death is bad for the person who dies."},
{"n": 71, "category": "Happiness & the Good Life", "question": "Beyond a certain point, more money doesn't make people happier."},
{"n": 72, "category": "Politics & Justice", "question": "Democracy is the best form of government we have."},
{"n": 73, "category": "God & Religion", "question": "Faith is a valid way of knowing truth, separate from reason."},
{"n": 74, "category": "Mind & Consciousness", "question": "If a machine can hold a conversation indistinguishable from a human's, we should say it thinks."},
{"n": 75, "category": "Knowledge & Truth", "question": "All knowledge ultimately comes from experience."},
{"n": 76, "category": "Ethics", "question": "Everyone is ultimately selfish; even acts of kindness are done for our own benefit."},
{"n": 77, "category": "Politics & Justice", "question": "Voters should have to pass a basic knowledge test before voting."},
{"n": 78, "category": "Technology & the Future", "question": "A self-driving car should protect its passengers over pedestrians."},
{"n": 79, "category": "Meaning & Mortality", "question": "Living forever would eventually become unbearably boring."},
{"n": 80, "category": "Happiness & the Good Life", "question": "The middle path between extremes is usually best."},
{"n": 81, "category": "Free Will & Responsibility", "question": "Even if free will is an illusion, society should keep believing in it."},
{"n": 82, "category": "Art & Beauty", "question": "Anything can be art if the art world treats it as art."},
{"n": 83, "category": "Politics & Justice", "question": "Hateful words can cause real harm, not just offence."},
{"n": 84, "category": "Ethics", "question": "If you had a ring that made you invisible and you could never be caught, you would still have good reason to act justly."},
{"n": 85, "category": "Reality & Existence", "question": "Change is an illusion; reality is one and unchanging."},
{"n": 86, "category": "Mind & Consciousness", "question": "Science will never explain why we have conscious experiences at all."},
{"n": 87, "category": "Knowledge & Truth", "question": "Wisdom begins with recognising how little you know."},
{"n": 88, "category": "Ethics", "question": "Adult children owe their parents care in old age."},
{"n": 89, "category": "Society & Culture", "question": "People from very different cultures can share universal values."},
{"n": 90, "category": "God & Religion", "question": "Without belief in God, morality would collapse."},
{"n": 91, "category": "Politics & Justice", "question": "Private property is a kind of theft."},
{"n": 92, "category": "Ethics", "question": "It is better to suffer an injustice than to commit one."},
{"n": 93, "category": "Meaning & Mortality", "question": "Since you didn't mind not existing before you were born, you shouldn't fear not existing after you die."},
{"n": 94, "category": "Self & Identity", "question": "Our habits shape who we are more than our big decisions do."},
{"n": 95, "category": "Politics & Justice", "question": "Privacy matters even if you have nothing to hide."},
{"n": 96, "category": "Mind & Consciousness", "question": "It is possible that other people have no inner experience and only act as if they do."},
{"n": 97, "category": "Knowledge & Truth", "question": "It is wrong to believe anything without enough evidence."},
{"n": 98, "category": "Society & Culture", "question": "Most people today feel disconnected from the work they do."},
{"n": 99, "category": "Reality & Existence", "question": "Time does not really flow; that is just how it feels to us."},
{"n": 100, "category": "Ethics", "question": "Our feelings, not reason, are the true source of our moral judgments."},
{"n": 101, "category": "Free Will & Responsibility", "question": "Our resentment toward people who wrong us makes sense even if their actions were determined."},
{"n": 102, "category": "Art & Beauty", "question": "A perfect forgery is just as valuable as the original painting."},
{"n": 103, "category": "Language & Logic", "question": "Many philosophical problems are really just confusions about language."},
{"n": 104, "category": "God & Religion", "question": "Something is good because God commands it, rather than God commanding it because it's good."},
{"n": 105, "category": "Ethics", "question": "It is fine to care more about some people than others."},
{"n": 106, "category": "Politics & Justice", "question": "Colonialism still shapes how the world thinks and works today."},
{"n": 107, "category": "Meaning & Mortality", "question": "Thinking about your own death regularly makes life better."},
{"n": 108, "category": "Happiness & the Good Life", "question": "Contentment comes from wanting less, not from having more."},
{"n": 109, "category": "Politics & Justice", "question": "If a leader can't be both loved and feared, it is better to be feared."},
{"n": 110, "category": "Ethics", "question": "A good enough goal can justify using bad methods to reach it."},
{"n": 111, "category": "Technology & the Future", "question": "Algorithms that decide what we see online threaten our freedom of thought."},
{"n": 112, "category": "Nature & Animals", "question": "Fish and insects can feel pain."},
{"n": 113, "category": "Knowledge & Truth", "question": "It is reasonable to trust experts even when you can't check their claims yourself."},
{"n": 114, "category": "Reality & Existence", "question": "The future is already as real as the past."},
{"n": 115, "category": "Politics & Justice", "question": "By choosing to live in a country, you have agreed to obey its laws."},
{"n": 116, "category": "Free Will & Responsibility", "question": "A drunk driver who kills a child deserves more blame than an equally drunk driver who happens to get home safely."},
{"n": 117, "category": "Free Will & Responsibility", "question": "You can do what you want, but you cannot choose what you want."},
{"n": 118, "category": "Art & Beauty", "question": "Art made by AI can be real art."},
{"n": 119, "category": "Language & Logic", "question": "The sentence 'This sentence is false' reveals a deep problem in logic."},
{"n": 120, "category": "God & Religion", "question": "Religions are mainly human creations that express human hopes and needs."},
{"n": 121, "category": "Society & Culture", "question": "Most people live their lives by following the crowd rather than choosing for themselves."},
{"n": 122, "category": "Happiness & the Good Life", "question": "People would be better off working far fewer hours."},
{"n": 123, "category": "Mind & Consciousness", "question": "Your smartphone is, in a real sense, part of your mind."},
{"n": 124, "category": "Knowledge & Truth", "question": "When intelligent people disagree with you, you should become less confident in your view."},
{"n": 125, "category": "Technology & the Future", "question": "A future where machines do all the work would be a good future."},
{"n": 126, "category": "Love & Friendship", "question": "A true friend tells you hard truths."},
{"n": 127, "category": "Society & Culture", "question": "Western philosophy has unfairly ignored other great philosophical traditions."},
{"n": 128, "category": "Ethics", "question": "We have stronger moral duties to our own family than to strangers."},
{"n": 129, "category": "Politics & Justice", "question": "People have the right to overthrow a government that violates their basic rights."},
{"n": 130, "category": "Reality & Existence", "question": "Nothing can come from nothing."},
{"n": 131, "category": "Meaning & Mortality", "question": "Anxiety is a sign of our freedom."},
{"n": 132, "category": "Love & Friendship", "question": "A friendship based only on usefulness or fun isn't true friendship."},
{"n": 133, "category": "Ethics", "question": "An action can be morally wrong even if it harms nobody."},
{"n": 134, "category": "God & Religion", "question": "Religion distracts people from fixing real injustice."},
{"n": 135, "category": "Politics & Justice", "question": "The majority can be just as tyrannical as a dictator."},
{"n": 136, "category": "Mind & Consciousness", "question": "Everything in the universe, even an atom, might have some tiny form of consciousness."},
{"n": 137, "category": "Free Will & Responsibility", "question": "Criminals who had terrible childhoods deserve less punishment."},
{"n": 138, "category": "Society & Culture", "question": "People are often disbelieved unfairly because of who they are."},
{"n": 139, "category": "Art & Beauty", "question": "A painting loses something special when it's mass-produced as copies."},
{"n": 140, "category": "Society & Culture", "question": "Education should teach people how to think, not what to think."},
{"n": 141, "category": "Technology & the Future", "question": "Every powerful new technology weakens some important human ability."},
{"n": 142, "category": "Ethics", "question": "There are objective moral truths, as real as the truths of mathematics."},
{"n": 143, "category": "Love & Friendship", "question": "Online friendships can be just as real as in-person ones."},
{"n": 144, "category": "Society & Culture", "question": "We judge other cultures' customs as strange or barbaric mainly because they're unfamiliar."},
{"n": 145, "category": "Reality & Existence", "question": "The existence of the universe needs an explanation."},
{"n": 146, "category": "Happiness & the Good Life", "question": "A life of pleasant experiences inside a perfect simulation would be just as good as a real life."},
{"n": 147, "category": "Love & Friendship", "question": "You cannot live a happy life without close friends."},
{"n": 148, "category": "Politics & Justice", "question": "Wealthy nations have a duty to accept refugees."},
{"n": 149, "category": "Mind & Consciousness", "question": "Emotions are a form of judgement, not just feelings."},
{"n": 150, "category": "Reality & Existence", "question": "Most people mistake appearances for reality."},
{"n": 151, "category": "God & Religion", "question": "We should never believe in a miracle based only on other people's reports."},
{"n": 152, "category": "Ethics", "question": "You should never treat a person merely as a tool to get what you want."},
{"n": 153, "category": "Ethics", "question": "Science can tell us how we ought to live."},
{"n": 154, "category": "Politics & Justice", "question": "Countries have the right to decide who may live within their borders."},
{"n": 155, "category": "Free Will & Responsibility", "question": "We cannot escape choosing; even refusing to choose is a choice."},
{"n": 156, "category": "Art & Beauty", "question": "Music without words can express specific emotions."},
{"n": 157, "category": "Society & Culture", "question": "Children should be taught philosophy in school."},
{"n": 158, "category": "Meaning & Mortality", "question": "The unexamined life is not worth living."},
{"n": 159, "category": "Happiness & the Good Life", "question": "Time alone is essential for a good life."},
{"n": 160, "category": "Reality & Existence", "question": "Ideas like 'justice' and 'beauty' exist independently of human minds."},
{"n": 161, "category": "Nature & Animals", "question": "An animal's suffering matters just as much as the same amount of human suffering."},
{"n": 162, "category": "Mind & Consciousness", "question": "Artificial intelligence could one day be genuinely conscious."},
{"n": 163, "category": "Knowledge & Truth", "question": "Science gives us the most reliable knowledge humans have."},
{"n": 164, "category": "Art & Beauty", "question": "Beauty of character matters more than physical beauty."},
{"n": 165, "category": "Society & Culture", "question": "Traditions deserve respect, even when we don't understand why they exist."},
{"n": 166, "category": "Politics & Justice", "question": "Justice is really just whatever benefits the powerful."},
{"n": 167, "category": "Society & Culture", "question": "Modern society has lost a shared foundation for its values."},
{"n": 168, "category": "Ethics", "question": "You can't work out what ought to be just from facts about what is."},
{"n": 169, "category": "Nature & Animals", "question": "Eating meat is morally wrong when we can live healthily without it."},
{"n": 170, "category": "Happiness & the Good Life", "question": "Other people's judgements of us are a major source of our unhappiness."},
{"n": 171, "category": "Nature & Animals", "question": "Living close to nature makes people wiser."},
{"n": 172, "category": "Politics & Justice", "question": "Punishment should aim to reform criminals, not to make them suffer."},
{"n": 173, "category": "Happiness & the Good Life", "question": "You should act without being attached to the results of your actions."},
{"n": 174, "category": "Art & Beauty", "question": "It makes sense to feel real emotions for fictional characters."},
{"n": 175, "category": "Knowledge & Truth", "question": "Learning is really a kind of remembering what we already know."},
{"n": 176, "category": "Meaning & Mortality", "question": "Everything happens for a reason."},
{"n": 177, "category": "Technology & the Future", "question": "If an AI said it was suffering, we would have a duty to take that seriously."},
{"n": 178, "category": "Knowledge & Truth", "question": "A theory that could never be proven wrong isn't really scientific."},
{"n": 179, "category": "Ethics", "question": "We have real moral duties to future generations, even though they don't exist yet."},
{"n": 180, "category": "Society & Culture", "question": "Being constantly watched changes how people behave, even when no one is actually watching."},
{"n": 181, "category": "God & Religion", "question": "All major religions point toward the same underlying truth."},
{"n": 182, "category": "Meaning & Mortality", "question": "A meaningful life requires being part of something larger than yourself."},
{"n": 183, "category": "Knowledge & Truth", "question": "You should trust your own judgement over the opinions of others."},
{"n": 184, "category": "Love & Friendship", "question": "Love makes us better people."},
{"n": 185, "category": "Nature & Animals", "question": "What is natural is generally good."},
{"n": 186, "category": "Politics & Justice", "question": "Society should change gradually rather than through revolution."},
{"n": 187, "category": "Ethics", "question": "Bringing a child into the world always involves harming them."},
{"n": 188, "category": "Knowledge & Truth", "question": "We know our own minds better than we know anything else."},
{"n": 189, "category": "Knowledge & Truth", "question": "Scientific revolutions happen as much because of social change as because of evidence."},
{"n": 190, "category": "Reality & Existence", "question": "This is the best of all possible worlds."},
{"n": 191, "category": "Free Will & Responsibility", "question": "People struggling with addiction are not fully responsible for their actions."},
{"n": 192, "category": "Art & Beauty", "question": "We enjoy sad stories because they let us release built-up emotions."},
{"n": 193, "category": "Society & Culture", "question": "The main purpose of education is to make good citizens."},
{"n": 194, "category": "Politics & Justice", "question": "Patriotism is a virtue."},
{"n": 195, "category": "Meaning & Mortality", "question": "From the perspective of the whole universe, nothing we do really matters."},
{"n": 196, "category": "Society & Culture", "question": "Wanting recognition and status from others is natural and healthy."},
{"n": 197, "category": "Ethics", "question": "It is acceptable to break a promise if breaking it leads to a much better result."},
{"n": 198, "category": "Nature & Animals", "question": "Humans have the right to use nature however they see fit."},
{"n": 199, "category": "God & Religion", "question": "Powerful religious experiences are good evidence that God exists."},
{"n": 200, "category": "Politics & Justice", "question": "We are citizens of the world first, and of our own country second."},
{"n": 201, "category": "Love & Friendship", "question": "To love someone is to see them clearly as they really are."},
{"n": 202, "category": "Society & Culture", "question": "There is a fixed human nature that no society can change."},
{"n": 203, "category": "Self & Identity", "question": "There is no permanent 'self' inside you; you are a changing bundle of experiences."},
{"n": 204, "category": "Knowledge & Truth", "question": "Some things we know can never be put into words."},
{"n": 205, "category": "Ethics", "question": "Being a good person requires actively helping others, not just avoiding harming them."},
{"n": 206, "category": "Reality & Existence", "question": "The physical world exists only as experienced by minds."},
{"n": 207, "category": "Happiness & the Good Life", "question": "Hardship is necessary for personal growth."},
{"n": 208, "category": "Ethics", "question": "Courage is the most important virtue, because all the others depend on it."},
{"n": 209, "category": "Self & Identity", "question": "Your character is your destiny."},
{"n": 210, "category": "Art & Beauty", "question": "Nature is more beautiful than any human art."},
{"n": 211, "category": "Society & Culture", "question": "Children learn best through experience, not instruction."},
{"n": 212, "category": "Politics & Justice", "question": "Everyone should receive a basic income from the state, whether or not they work."},
{"n": 213, "category": "Nature & Animals", "question": "Rivers, forests, and mountains can have legal rights."},
{"n": 214, "category": "Politics & Justice", "question": "It is sometimes right to break the law."},
{"n": 215, "category": "God & Religion", "question": "A deeply spiritual life doesn't require belief in God."},
{"n": 216, "category": "Self & Identity", "question": "You are your memories: without them you wouldn't be the same person."},
{"n": 217, "category": "Knowledge & Truth", "question": "Common sense is a reliable guide to truth."},
{"n": 218, "category": "Politics & Justice", "question": "Freedom simply means not being interfered with by others."},
{"n": 219, "category": "Meaning & Mortality", "question": "People can find meaning even in the worst suffering."},
{"n": 220, "category": "Society & Culture", "question": "You become like the people you spend time with."},
{"n": 221, "category": "Reality & Existence", "question": "The world we experience is a kind of illusion covering a deeper reality."},
{"n": 222, "category": "Love & Friendship", "question": "Marriage is more a social contract than a romantic bond."},
{"n": 223, "category": "Society & Culture", "question": "People from marginalised groups often see themselves through the eyes of others."},
{"n": 224, "category": "Politics & Justice", "question": "You should obey the law even when you think a particular law is unjust."},
{"n": 225, "category": "Nature & Animals", "question": "Individuals have a moral duty to reduce their own carbon footprint."},
{"n": 226, "category": "Knowledge & Truth", "question": "There is no sure way to tell whether you are dreaming right now."},
{"n": 227, "category": "Free Will & Responsibility", "question": "If God already knows what you will do tomorrow, you can't freely choose otherwise."},
{"n": 228, "category": "Knowledge & Truth", "question": "There are no facts, only interpretations."},
{"n": 229, "category": "Art & Beauty", "question": "Feeling small before something vast, like the ocean or the night sky, is one of life's most valuable experiences."},
{"n": 230, "category": "Knowledge & Truth", "question": "Finding the truth matters more than winning an argument."},
{"n": 231, "category": "Politics & Justice", "question": "A person in poverty isn't truly free, even if nobody stops them from doing anything."},
{"n": 232, "category": "Meaning & Mortality", "question": "In the long run, people's actions come back to them."},
{"n": 233, "category": "Free Will & Responsibility", "question": "Ordinary people who follow evil orders are fully responsible for the evil they help commit."},
{"n": 234, "category": "Self & Identity", "question": "Life's main task is to become who you truly are."},
{"n": 235, "category": "Ethics", "question": "Good manners and rituals are essential to being a good person."},
{"n": 236, "category": "God & Religion", "question": "Your deepest self is one with the ultimate reality of the universe."},
{"n": 237, "category": "Politics & Justice", "question": "Non-violent resistance is always better than violent resistance."},
{"n": 238, "category": "Ethics", "question": "A son should protect his father rather than report him for stealing."},
{"n": 239, "category": "Politics & Justice", "question": "People should need a licence to become parents."},
{"n": 240, "category": "Politics & Justice", "question": "Women have an equal right to education and intellectual life."},
{"n": 241, "category": "Nature & Animals", "question": "Humans should try to reduce the suffering of wild animals."},
{"n": 242, "category": "Self & Identity", "question": "If your brain were perfectly copied into a computer, that computer would be you."},
{"n": 243, "category": "Knowledge & Truth", "question": "Reality has many sides, and every viewpoint captures only part of the truth."},
{"n": 244, "category": "Meaning & Mortality", "question": "Life contains more suffering than happiness."},
{"n": 245, "category": "Society & Culture", "question": "People are born good; bad surroundings make them bad."},
{"n": 246, "category": "God & Religion", "question": "Not knowing whether God exists is the only honest position."},
{"n": 247, "category": "Society & Culture", "question": "Luck plays a bigger role in success than most successful people admit."},
{"n": 248, "category": "Art & Beauty", "question": "We should separate great art from the bad behaviour of the artist."},
{"n": 249, "category": "Knowledge & Truth", "question": "Thinking for yourself takes courage."},
{"n": 250, "category": "Ethics", "question": "A person who always did the most moral thing possible would not be an ideal person to be."},
{"n": 251, "category": "Politics & Justice", "question": "A society should be judged by what its people are actually able to do and become."},
{"n": 252, "category": "Reality & Existence", "question": "Nothing exists independently; everything depends on everything else."},
{"n": 253, "category": "Language & Logic", "question": "The language you speak shapes how you think."},
{"n": 254, "category": "Knowledge & Truth", "question": "What a reliable person tells you is a genuine source of knowledge, just like seeing it yourself."},
{"n": 255, "category": "Nature & Animals", "question": "Protecting a species matters, not just protecting individual animals."},
{"n": 256, "category": "Ethics", "question": "Caring relationships, not abstract rules, are the heart of morality."},
{"n": 257, "category": "Society & Culture", "question": "Women's unequal position in society comes from custom and education, not nature."},
{"n": 258, "category": "Happiness & the Good Life", "question": "We should accept what we can't control instead of fighting against it."},
{"n": 259, "category": "Society & Culture", "question": "People are naturally selfish and need education to become good."},
{"n": 260, "category": "Ethics", "question": "Parents have the right to raise their children with their own religious and political beliefs."},
{"n": 261, "category": "Knowledge & Truth", "question": "Crowds can make wiser decisions than experts."},
{"n": 262, "category": "God & Religion", "question": "The very idea of a perfect being proves that such a being exists."},
{"n": 263, "category": "Politics & Justice", "question": "People who are rich have generally earned their wealth."},
{"n": 264, "category": "Art & Beauty", "question": "Popular entertainment can be as valuable as 'high' art."},
{"n": 265, "category": "Society & Culture", "question": "Teachers should stay neutral on controversial issues."},
{"n": 266, "category": "Ethics", "question": "Your conscience is a reliable guide to right and wrong."},
{"n": 267, "category": "Self & Identity", "question": "People have no fixed nature; we create ourselves through our choices."},
{"n": 268, "category": "Society & Culture", "question": "Gender roles are mostly created by society rather than by biology."},
{"n": 269, "category": "Mind & Consciousness", "question": "Your unconscious mind controls more of your behaviour than you realise."},
{"n": 270, "category": "Knowledge & Truth", "question": "The value of philosophy lies in its questions, not its answers."},
{"n": 271, "category": "Ethics", "question": "Selling your own kidney should be legal."},
{"n": 272, "category": "Meaning & Mortality", "question": "A life is best understood as a story, with meaning only visible as a whole."},
{"n": 273, "category": "Happiness & the Good Life", "question": "Sometimes the wisest action is to do nothing and let things take their course."},
{"n": 274, "category": "Ethics", "question": "Humanity has made genuine moral progress over history."},
{"n": 275, "category": "Politics & Justice", "question": "Free markets are generally the fairest way to decide who gets what."},
{"n": 276, "category": "God & Religion", "question": "Science and religion are fundamentally in conflict."},
{"n": 277, "category": "Politics & Justice", "question": "Unpaid care work at home deserves to be paid."},
{"n": 278, "category": "Knowledge & Truth", "question": "Most people prefer comfortable lies to uncomfortable truths."},
{"n": 279, "category": "Mind & Consciousness", "question": "Two people can never be sure they see the same colour when they look at a red apple."},
{"n": 280, "category": "Technology & the Future", "question": "Social media makes it harder for people to find the truth."},
{"n": 281, "category": "Society & Culture", "question": "Categories like 'race' are human inventions, not natural divisions."},
{"n": 282, "category": "Ethics", "question": "Torture could be justified to stop an imminent terrorist attack."},
{"n": 283, "category": "Knowledge & Truth", "question": "We can choose what to believe."},
{"n": 284, "category": "Art & Beauty", "question": "Great art reveals truths about the world that nothing else can."},
{"n": 285, "category": "Society & Culture", "question": "Education is never politically neutral."},
{"n": 286, "category": "Meaning & Mortality", "question": "If humanity were going to end soon after your death, much of what you do would feel pointless."},
{"n": 287, "category": "Happiness & the Good Life", "question": "A good life depends partly on luck outside our control."},
{"n": 288, "category": "Knowledge & Truth", "question": "Everything we value, including love and art, can be explained by evolution."},
{"n": 289, "category": "Ethics", "question": "Some things should never be for sale, such as votes, organs, or university places."},
{"n": 290, "category": "Ethics", "question": "Even if a fetus is a person, a woman can have the right to end a pregnancy."},
{"n": 291, "category": "Knowledge & Truth", "question": "At birth, the mind is a blank slate."},
{"n": 292, "category": "Knowledge & Truth", "question": "Believing in a conspiracy theory can sometimes be perfectly rational."},
{"n": 293, "category": "Happiness & the Good Life", "question": "Craving and attachment are the root causes of suffering."},
{"n": 294, "category": "Politics & Justice", "question": "Present-day societies owe repair for historical injustices like slavery and colonialism."},
{"n": 295, "category": "Meaning & Mortality", "question": "Standing up against injustice gives life meaning."},
{"n": 296, "category": "Happiness & the Good Life", "question": "Buying more things rarely makes people happier."},
{"n": 297, "category": "Reality & Existence", "question": "There may be other worlds where you made different choices."},
{"n": 298, "category": "Ethics", "question": "Welcoming strangers is a basic moral duty."},
{"n": 299, "category": "Ethics", "question": "A person's dignity does not depend on their usefulness to society."},
{"n": 300, "category": "Knowledge & Truth", "question": "Science will eventually be able to answer every important question."},
{"n": 301, "category": "Ethics", "question": "When giving to charity, we should choose based on evidence of how much good each donation actually does."},
{"n": 302, "category": "Free Will & Responsibility", "question": "Choosing not to act is still a choice you are responsible for."},
{"n": 303, "category": "Art & Beauty", "question": "The purpose of art is to create a refined emotional experience in its audience."},
{"n": 304, "category": "Knowledge & Truth", "question": "Doubting everything is the best way to start thinking clearly."},
{"n": 305, "category": "Ethics", "question": "War can sometimes be morally justified."},
{"n": 306, "category": "Knowledge & Truth", "question": "We are born already knowing some things."},
{"n": 307, "category": "Language & Logic", "question": "Careless talk that doesn't care about truth is more dangerous than lying."},
{"n": 308, "category": "Happiness & the Good Life", "question": "It is better to be a dissatisfied human than a satisfied pig."},
{"n": 309, "category": "Society & Culture", "question": "Advertising creates desires people wouldn't otherwise have."},
{"n": 310, "category": "Ethics", "question": "Non-violence toward all living beings is the highest duty."},
{"n": 311, "category": "Language & Logic", "question": "The deepest truths cannot be put into words."},
{"n": 312, "category": "Reality & Existence", "question": "A whole can be more than the sum of its parts."},
{"n": 313, "category": "Politics & Justice", "question": "The death penalty is just for the very worst crimes."},
{"n": 314, "category": "Ethics", "question": "Performance-enhancing drugs should be allowed in sport."},
{"n": 315, "category": "Society & Culture", "question": "A person becomes a person through other people."},
{"n": 316, "category": "Society & Culture", "question": "Honour codes can be a powerful force for moral change."},
{"n": 317, "category": "Ethics", "question": "We should love all people equally, not just those close to us."},
{"n": 318, "category": "Love & Friendship", "question": "Paying full attention to someone is the purest form of generosity."},
{"n": 319, "category": "Free Will & Responsibility", "question": "Random events in the brain could be what gives us free will."},
{"n": 320, "category": "Knowledge & Truth", "question": "Your memories are trustworthy records of the past."},
{"n": 321, "category": "Art & Beauty", "question": "Imperfection and impermanence make things more beautiful."},
{"n": 322, "category": "Language & Logic", "question": "A good argument can lead to a conclusion you should accept, even if it feels wrong."},
{"n": 323, "category": "Happiness & the Good Life", "question": "The present moment is the only time we truly have."},
{"n": 324, "category": "Happiness & the Good Life", "question": "Humans are most fully human when they play."},
{"n": 325, "category": "Politics & Justice", "question": "Political democracy cannot survive without social and economic equality."},
{"n": 326, "category": "God & Religion", "question": "God and Nature are one and the same."},
{"n": 327, "category": "Ethics", "question": "Cruelty is the worst thing human beings do."},
{"n": 328, "category": "Reality & Existence", "question": "Travelling back in time is logically possible."},
{"n": 329, "category": "Nature & Animals", "question": "Keeping animals in zoos is wrong."},
{"n": 330, "category": "Politics & Justice", "question": "Nationalism is a danger to humanity."},
{"n": 331, "category": "Knowledge & Truth", "question": "Our senses show us the world as it really is."},
{"n": 332, "category": "Reality & Existence", "question": "Mathematics is discovered, not invented."},
{"n": 333, "category": "Meaning & Mortality", "question": "Things that happen after your death can still harm you."},
{"n": 334, "category": "Happiness & the Good Life", "question": "In an ideal world with no need to work, people would spend their time playing games."},
{"n": 335, "category": "Happiness & the Good Life", "question": "Anger is never truly useful; we would be better off without it."},
{"n": 336, "category": "Love & Friendship", "question": "It is possible to be friends with someone whose moral views you find wrong."},
{"n": 337, "category": "Ethics", "question": "Respecting your elders is a core moral duty."},
{"n": 338, "category": "Free Will & Responsibility", "question": "People often claim they 'had no choice' to avoid taking responsibility."},
{"n": 339, "category": "Art & Beauty", "question": "Good design and craftsmanship in everyday objects matter as much as fine art."},
{"n": 340, "category": "Language & Logic", "question": "Silence can sometimes say more than words."},
{"n": 341, "category": "God & Religion", "question": "Properly understood, religion and philosophy never truly contradict each other."},
{"n": 342, "category": "Politics & Justice", "question": "Leaders should rule by moral example rather than by laws and punishments."},
{"n": 343, "category": "Meaning & Mortality", "question": "The universe has a purpose or direction."},
{"n": 344, "category": "Nature & Animals", "question": "Humans are part of nature, not separate from it."},
{"n": 345, "category": "Ethics", "question": "You should forgive someone even if they haven't apologised."},
{"n": 346, "category": "Reality & Existence", "question": "Colours exist only in our minds, not in objects themselves."},
{"n": 347, "category": "Reality & Existence", "question": "Cause and effect may just be a habit of expectation, not a real connection in nature."},
{"n": 348, "category": "Technology & the Future", "question": "Medicine that let people live to 200 would be good for humanity."},
{"n": 349, "category": "Happiness & the Good Life", "question": "Wealth and pleasure are legitimate goals in life, alongside duty and spiritual freedom."},
{"n": 350, "category": "Society & Culture", "question": "Societies rise and fall in predictable cycles."},
{"n": 351, "category": "Ethics", "question": "Doctors should always tell patients the full truth, even when it will hurt them."},
{"n": 352, "category": "Love & Friendship", "question": "Grief is the price we pay for loving."},
{"n": 353, "category": "Language & Logic", "question": "Names and words must match reality for a society to function well."},
{"n": 354, "category": "Free Will & Responsibility", "question": "If something is fated to happen, there is no point trying to change it."},
{"n": 355, "category": "Art & Beauty", "question": "Paying careful attention to beauty makes us less selfish."},
{"n": 356, "category": "Knowledge & Truth", "question": "A truly wise person can see things from many perspectives without being trapped in one."},
{"n": 357, "category": "Meaning & Mortality", "question": "There is no life after death, so we should fully enjoy this one."},
{"n": 358, "category": "Reality & Existence", "question": "Everything is impermanent; nothing lasts forever."},
{"n": 359, "category": "Nature & Animals", "question": "Experiments on animals are justified if they lead to medical breakthroughs for humans."},
{"n": 360, "category": "Mind & Consciousness", "question": "If you floated in the air with no senses at all, you would still know that you exist."},
{"n": 361, "category": "Knowledge & Truth", "question": "Real knowledge always leads to action; if you don't act on it, you don't truly know it."},
{"n": 362, "category": "Happiness & the Good Life", "question": "Most of humanity's problems come from our inability to sit quietly in a room alone."},
{"n": 363, "category": "Meaning & Mortality", "question": "Things with no practical use can be the most valuable of all."},
{"n": 364, "category": "Society & Culture", "question": "Loneliness makes societies vulnerable to extremism."},
{"n": 365, "category": "Ethics", "question": "Euthanasia should be legal for adults who clearly choose it."}
]
$$::jsonb) as s(n integer, category text, question text)
order by s.n
on conflict (rotation_position) do nothing;
