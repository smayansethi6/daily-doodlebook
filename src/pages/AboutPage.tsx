import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { RESET_LABEL } from "@/lib/time";

const AboutPage = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <SiteHeader action={{ to: "/", label: "Today's question" }} />

    <main className="container mx-auto w-full max-w-3xl flex-1 px-4 py-10 space-y-6">
      <h1 className="text-editorial text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        About ThinkPhil
      </h1>

      <p className="text-[15px] leading-7 text-foreground">
        ThinkPhil asks one philosophical question a day and gives you a quiet place to answer it.
        A new question arrives at {RESET_LABEL}, the same question for everyone, so the stance map
        you see after writing describes one shared day of thinking. It is run by a small team who
        write and schedule the questions by hand.
      </p>

      <p className="text-[15px] leading-7 text-foreground">
        There are no accounts and no login. Your reflection is stored without any name, email or
        location attached, and the list under &ldquo;My responses&rdquo; is kept in this browser
        alone. Entries stay private unless you tick &ldquo;Let others read this anonymously&rdquo;
        — and even then they are shown only after a person on the team has reviewed them, trimmed
        to a short excerpt, carrying nothing but the stance you chose. Ink, the writing companion,
        is an AI assistant built on Google&apos;s Gemini models; what you type to it is sent to
        Google to generate a reply and is not stored by us.
      </p>

      <p className="text-[15px] leading-7 text-foreground">
        If you see a reflection that should not be there, the report button under it hides the
        entry from everyone immediately while we look at it.
      </p>
    </main>

    <SiteFooter />
  </div>
);

export default AboutPage;
