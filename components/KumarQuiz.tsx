"use client";

import { useState } from "react";

/* THE QUIZ (owner, 2026-08-12): three questions, four answers each —
   one real rule from the book, one fake that sounds like every finance
   guru, one fake that sounds half-plausible, one deadpan-absurd. Every
   option gets a verdict in Kumar's voice, and the wrong ones teach the
   real rule on the way out.

   Dev harness for now: launched from the start-quiz button in the
   bottom-left corner (Experience). The final home on the site is
   still to be decided. */

type QuizOption = {
  text: string;
  /** Kumar's reaction when this option is picked */
  verdict: string;
  correct?: boolean;
};

type QuizQuestion = {
  source: string;
  options: QuizOption[];
};

const PROMPT = "One of these is a real rule from the book. Which one?";

const QUESTIONS: QuizQuestion[] = [
  {
    source: "Chapter II — On Financial Discipline",
    options: [
      {
        text: "Buy everything you can on sale, in bulk. A garage full of discounts is a portfolio that never goes down.",
        verdict:
          "No. Spending sixty dollars to save forty on something you did not need still cost you sixty. A garage full of discounts is not a portfolio. It is a storage problem.",
      },
      {
        text: "Cut the small pleasures first. The daily coffees and lunches are where wealth quietly leaks away.",
        verdict:
          "Every finance guru says this, and it is backwards. Keep your essentials under 55 percent of your income — and if they run higher, the fix is a cheaper home or car, not skipping lunch.",
      },
      {
        text: "If you can't afford to buy something twice, you can't afford to buy it once.",
        verdict: "Correct. That is the last rule of Chapter II, and the cheapest one to follow.",
        correct: true,
      },
      {
        text: "Carry a small balance on two credit cards. Banks reward the customers they earn interest from.",
        verdict:
          "The bank thanks you for your service. Pay your card in full every month — credit is a reputation, not a subscription.",
      },
    ],
  },
  {
    source: "Chapter III — On Family and Money",
    options: [
      {
        text: "Never hire a relative you would not be able to fire.",
        verdict: "Correct. A bad employee can cost you money. A bad family hire can cost you the business.",
        correct: true,
      },
      {
        text: "Keep one shared family account, so money stays transparent across the generations.",
        verdict:
          "One account, five opinions, zero peace. Teach your children how money works instead — the inheritance is judgment, not access.",
      },
      {
        text: "Lend money to family instead of giving it. A loan teaches responsibility where a gift teaches dependence.",
        verdict:
          "Backwards. It is better to give money to family than to lend it. A loan can turn love into a ledger, and late payments into resentment.",
      },
      {
        text: "Assign the taxes to your firstborn. That is why you have children.",
        verdict:
          "I did the taxes for thirty-one years so my children would not have to. Teach them how money works instead.",
      },
    ],
  },
  {
    source: "Chapter VI — On Betting & Predicting",
    options: [
      {
        text: "Follow your loudest friend's bets and take the other side. The crowd is your edge.",
        verdict: "Your friend is not an index. A prediction market is worth reading, not feeding — and so is he.",
      },
      {
        text: "Set aside two percent of your income for sports betting and treat it strictly as entertainment.",
        verdict:
          "That is what the apps suggest, and the apps cut off every customer who wins. There is no entertainment budget in this book.",
      },
      {
        text: "A parlay is simply a portfolio with more conviction.",
        verdict:
          "A portfolio owns productive assets and compounds. A parlay adds uncertainty until the house has enough edge to make your confidence profitable for them. Conviction is not a discount code.",
      },
      {
        text: "If an outcome would genuinely cost you money in your life or business, a bet against it is insurance.",
        verdict: "Correct. Use prediction markets to hedge real risk. It is the one bet I like that is not on yourself.",
        correct: true,
      },
    ],
  },
];

const ROMAN = ["I", "II", "III"];

function scoreLine(score: number): string {
  if (score === 3) return "Three of three. Either you have read the book, or you should have written it.";
  if (score === 2) return "Two of three. Respectable. The book is short — finish it.";
  if (score === 1) return "One of three. The good news is the book was written for exactly this.";
  return "Zero of three. Sheba scored higher, and she has not read it either.";
}

export default function KumarQuiz({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = QUESTIONS[index];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (q.options[i].correct) setScore((s) => s + 1);
  }

  function next() {
    if (index + 1 >= QUESTIONS.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  return (
    <div className="quizOverlay" onClick={onClose}>
      <div className="quizCard" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="quizClose" aria-label="Close the quiz" onClick={onClose}>
          ×
        </button>
        {done ? (
          <>
            <div className="quizSource">The Kumar Method — a short quiz</div>
            <div className="quizScoreBig">
              {ROMAN[score - 1] ?? "0"} <span>of</span> III
            </div>
            <p className="quizVerdict">{scoreLine(score)}</p>
            <div className="quizRow">
              <button type="button" className="quizNext" onClick={restart}>
                Try again
              </button>
              <button type="button" className="quizNext quizGhost" onClick={onClose}>
                Back to the book
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="quizSource">
              Question {ROMAN[index]} of III · {q.source}
            </div>
            <p className="quizPrompt">{PROMPT}</p>
            <div className="quizOpts">
              {q.options.map((opt, i) => {
                const revealed = picked !== null;
                const cls = [
                  "quizOpt",
                  revealed && opt.correct ? "optCorrect" : "",
                  revealed && picked === i && !opt.correct ? "optWrong" : "",
                  revealed && picked !== i && !opt.correct ? "optDim" : "",
                ].join(" ");
                return (
                  <button key={i} type="button" className={cls} onClick={() => pick(i)} disabled={revealed}>
                    {opt.text}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <>
                <p className="quizVerdict">{q.options[picked].verdict}</p>
                <div className="quizRow">
                  <button type="button" className="quizNext" onClick={next}>
                    {index + 1 >= QUESTIONS.length ? "See the verdict" : "Next question"}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
