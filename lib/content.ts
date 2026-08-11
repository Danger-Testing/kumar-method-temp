export type Chapter = {
  roman: string;
  /** Small line above the big title, e.g. "ON THE" */
  eyebrow: string;
  /** Big title, split into display lines */
  titleLines: string[];
  /** Short name used in running heads and the contents page */
  shortName: string;
  /** Full chapter name for the contents page */
  fullName: string;
  intro: string[];
  rules: string[];
};

export const BOOK_TITLE = "The Kumar Method";
export const BOOK_SUBTITLE = "A short list of plain rules about money and about life";

export const chapters: Chapter[] = [
  {
    roman: "I",
    eyebrow: "ON THE",
    titleLines: ["BASICS"],
    shortName: "The Basics",
    fullName: "On the Basics",
    intro: [
      "I have started my life over in three countries and in more businesses than I can count. India, then Bahrain, then America. Accounting, gas stations, a clinic, rental buildings, other people's companies. Some of it worked and plenty of it did not, and I learned more from the failures than the wins.",
      "I am an accountant, so I have spent my life making people's stories match their numbers, my own included. Do that long enough, and start over from nothing enough times, and you stop believing in shortcuts. You start seeing things the way they really are, and you notice how little of what people worry about matters in the end. The older I get, the fewer things I am sure of. What is left is a short list of plain rules about money and about life. Starting from the basics.",
    ],
    rules: [
      "See reality as it is, not as you wish it to be. Every good plan begins there.",
      "Write down the amount of money you need to live without taking a job you hate. Then write down the date you want to have it by. If you do not know what freedom costs, you will keep accepting bad bosses, bad deals, and extra years of work because you do not know when you have enough.",
      "Take your finances seriously. Pay your credit card in full every month. Credit is not money. It is a reputation. Build it before you need it, because the cheapest money goes to people who have already proved they can live without it.",
      "Drive an inexpensive car. Spend on the home you return to. Your car is a costume for strangers. Your home is where your real life happens. Invest in that.",
      "People are wired differently and want different things. Before you take anyone's advice, figure out what they want and what they gain if you follow it.",
      "Your inner circle is your biggest asset. Real friends show up when you are low, invest in you before you are obvious, open doors as you grow, and celebrate when you win.",
      "Learn to sell. Not the sleazy kind, just the ability to make people see why something matters. It is the skill sitting under every other skill.",
      "If you promise something, do it, even after it stops being convenient. People will forget your words but they will remember whether they could count on you.",
      "It's okay to make mistakes. It's not okay to not learn from them.",
      "Time is money. Save both.",
    ],
  },
  {
    roman: "II",
    eyebrow: "ON FINANCIAL",
    titleLines: ["DISCIPLINE"],
    shortName: "Financial Discipline",
    fullName: "On Financial Discipline",
    intro: [
      "I qualified as a Chartered Accountant in —— and spent the next 31 years looking after other people's finances. I saw salaries, debts, businesses, and what was really going on behind closed doors. One thing became obvious pretty quickly: how much someone earned had very little to do with whether they were actually doing well financially.",
    ],
    rules: [
      "Don't confuse looking rich with being rich. Looking rich is spending money so strangers think you have it. Being rich is having enough money that you do not need strangers to think anything. One buys attention. The other buys freedom.",
      "Spend less than you make. Every clever thing you'll ever do with money is downstream of this.",
      "Keep your essentials under 55 percent of your income. Rent, food, transport, the bills you cannot skip. If they run higher than that, the fix is a cheaper home or car, not skipping lunch.",
      "Know your numbers cold. What comes in, what goes out, what you owe, and how long you'd last if the money stopped tomorrow.",
      "If your spending climbs every time your income does, you'll make great money and still stay broke. That's most people, and it isn't just the low earners, roughly a third of households making over $150,000 live paycheck to paycheck too.",
      "Give big purchases a night to breathe. If you still want it in the morning, fine.",
      "Keep three to six months of expenses in boring cash and never touch it. Its only job is to keep you from ever making a decision out of desperation, and desperation is where people take the bad job, the payday loan, and the deal they know is wrong.",
      "Cancel every subscription at once, then add back only the ones you actually miss within a month. Recurring charges are built to be forgotten, and forgotten is exactly how they make their money.",
      "A sale is not a reason to buy. Spending sixty dollars to save forty on something you did not need still cost you sixty.",
      "If you can't afford to buy something twice, you can't afford to buy it once.",
    ],
  },
  {
    roman: "III",
    eyebrow: "ON FAMILY",
    titleLines: ["& MONEY"],
    shortName: "Family & Money",
    fullName: "On Family and Money",
    intro: [
      "My wife Sheba and I had been married only six months when my father died with no warning and no will. Overnight I was responsible for my mother, thirty-nine and suddenly a widow, my two younger brothers, still boys, and a tangle of debts no one had written down. We were newlyweds, and Sheba never once complained. She stepped into my family and held it up, carrying a burden that was never hers. I have built many things since, and none of them has mattered as much as who I chose to stand beside.",
    ],
    rules: [
      "The most important decision you will ever make is choosing a lifelong partner. It shapes your money, your peace, and your children long after every other choice is forgotten.",
      "If you are going to be an entrepreneur, marry someone stable. One person can chase the upside because the other protects the floor. Stability and risk are not opposites. They make each other possible.",
      "Teach your children how money works. Do not just leave them money. If they do not understand how it was built, they will not know how to keep it. The best inheritance is not a bank account. It is the judgment to build one.",
      "Go into business with family only if the terms are as clear as they would be with a stranger.",
      "Never hire a relative you would not be able to fire. A bad employee can cost you money. A bad family hire can cost you the business.",
      "Put your affairs in order while you are still here to explain them. Grief is hard enough. Do not leave the people you love a scavenger hunt.",
      "It's better to give money to family than to lend it. Do not lend what you cannot afford to lose. A loan can turn love into a ledger, and late payments into resentment.",
      "Rescuing a grown child from every mistake keeps them a child. Sometimes the most loving thing you can do with your money is refuse to hand it over.",
      "If you are holding a stock that has grown for years, do not always sell it and pay the tax yourself. Give it to an adult child who sits in a low bracket and let them sell, where the same gain can be taxed at zero. The asset stays in the family and the tax bill disappears.",
      "Never stake the family's security on a single investment, no matter how certain it looks.",
    ],
  },
  {
    roman: "IV",
    eyebrow: "ON FRIENDS",
    titleLines: ["& MONEY"],
    shortName: "Friends & Money",
    fullName: "On Friends and Money",
    intro: [
      "I've spent most of my life around other people's money. I've seen people lend money to friends and never get it back, start businesses together on a handshake and end up in court, or suddenly come into money and lose an old friendship over it. Most of the time, it wasn't some huge betrayal. It was a small thing that could have been avoided if they'd been clearer with each other from the start.",
      "My own friends have carried me through some of the biggest moments in my life, and I've worked hard to keep those friendships intact. This chapter is about how to lend money to a friend, go into business with one, or build wealth together without letting money ruin the relationship.",
    ],
    rules: [
      "Do not lend a friend money you want back. If you lend anyway, put it on one page with the amount, the date, and interest, and above ten thousand dollars charge at least the federal rate so the skipped interest is not taxed as a gift.",
      "Going into business with a friend puts the friendship on the table next to the money. Form a real entity with a written operating agreement, a clear ownership split, and a tiebreaker before you make a dollar.",
      "Treat money into a friend's company like any other investment, with a real price and real paperwork. Have the shares issued to you directly in a C-corporation: if it fails, Section 1244 can turn the loss into a write-off against your ordinary income.",
      "When you out-earn your friends, the friendship runs on your discretion and their grace. Spend more on them, say less about it, and never make them feel the gap.",
      "When a friend brings you into their fund or their startup, judge the deal the way you would a stranger's, then decide on the numbers alone. Do not put money in just because they asked, and if you pass, make clear you are turning down the deal and not them.",
      "Never hire a friend you could not fire, and never work for one you could not quit.",
      "If friends always want your professional work for free, you will come to resent them. Give the first favor freely and price the rest.",
      "Your introduction is your name on their loan. Never vouch for a friend you would not back with your own money, because when they let someone down it lands on you.",
      "If you ever borrow from a friend, pay it back faster than you would a bank and offer interest they will probably refuse.",
      "When money is involved, be the reliable one. That reputation is worth more than any single loan.",
    ],
  },
  {
    roman: "V",
    eyebrow: "ON",
    titleLines: ["INVESTING"],
    shortName: "Investing",
    fullName: "On Investing",
    intro: [
      "I have put money into more things than I can count. Gas stations. A physiotherapy clinic. Rental units. Assisted living facilities. An accounting firm. Restaurants half a world away in Seoul. Some of them made me money. Some only taught me, which is the more expensive kind of lesson. After enough of both, the patterns become clear, and they are almost never the ones that feel exciting at the time.",
    ],
    rules: [
      "You only need to get rich once. After you have won, stop making bets that can send you back to zero.",
      "A great asset at the wrong price is a bad investment, and an ordinary one at a great price is where most fortunes are made.",
      "Back the operator before the idea. A strong person will fix a weak plan, and a weak one will sink a strong plan.",
      "Leverage makes a good year great and a bad year final. Borrow only where you can survive being completely wrong.",
      "Be suspicious of anything that is exciting and that everyone already agrees on. By the time the crowd agrees, the upside has usually gone to the people who got there first.",
      "Never put money you will need soon into something that moves. When your timeline and the asset's swings don't line up, the market chooses when you sell, and it always chooses the worst moment.",
      "Back founders who can sell. One who can raise money and recruit people survives problems that would kill a better product.",
      "Read the cap table before you fall for the pitch. A messy one, or a burned early investor, poisons every round that comes after.",
      "Money is the easiest thing good companies can find. If a check is all you bring, you won't get good deals.",
      "Your reputation is your real deal flow. People bring their best opportunities to those they trust and never show them to strangers.",
    ],
  },
  {
    roman: "VI",
    eyebrow: "ON BETTING",
    titleLines: ["& PREDICTING"],
    shortName: "Betting & Predicting",
    fullName: "On Betting & Predicting",
    intro: [
      "I have never made money on a game of chance. Everything I built came from betting on my own work, where I understood the odds better than anyone across the table. Across a long career in other people's books, I sat with sharp, capable men who had talked themselves into believing a lucky streak was a skill. I am an accountant, so I read a bet the way I read any deal. I want to know who really has the edge, and who is paying for the other side to have it.",
    ],
    rules: [
      "Only bet when you have asymmetric information, and ideally when the bet is on yourself.",
      "Do not confuse a parlay with a portfolio because both have numbers on the screen. A portfolio owns productive assets and compounds over time. A parlay adds uncertainty until the house has enough edge to make your confidence profitable for them.",
      "Betting used to require leaving your house. Now it requires opening a notification. Sports bettors are 15 times more likely than in-person-only bettors to miss a bill payment. Don't miss your bill payments.",
      "Young men are being sold the fantasy that sports knowledge is a financial edge. The market is built to price the starting lineup, and you are not going to consistently win.",
      "You owe tax on every winning bet, even in a year you finished down. Wins get counted, losses only help if you itemize, so a losing year can still bring a tax bill.",
      "Use prediction markets to hedge real risk. If an outcome would actually cost you money in your life or business, a bet against it is insurance.",
      "If you ever get good enough to win, some app will cut your limits or close your account. A business that fires its winners is telling you who it was built for.",
      "Chasing a loss is how a bad night becomes a bad year. The bet you place to win it all back is usually the one that finishes you.",
      "Legal betting is a tax the state now collects through your phone. The league, the app, and the government each take a cut, and all of it comes out of the players.",
      "A prediction market is worth reading, not feeding. Its price already holds what thousands of informed people expect, which is useful to know and costly to bet against.",
    ],
  },
  {
    roman: "VII",
    eyebrow: "ON STARTING",
    titleLines: ["YOUR OWN", "COMPANY"],
    shortName: "Starting Your Own Company",
    fullName: "On Starting Your Own Company",
    intro: [
      "I started my first business at twenty-five, a small accounting practice with a friend, before I really knew what I was doing. I have been starting things ever since. Some grew, some failed, some I sold, and a few I should have closed long before I did. Later I watched a hundred-million-dollar company run its money from the inside, and now I spend my days helping young founders raise, build, and sell. I have made most of the mistakes in this chapter myself.",
    ],
    rules: [
      "Start a company and own the upside of your effort. Freedom begins when you earn equity instead of renting out your time for salary.",
      "Choose a cofounder as carefully as a spouse. You need shared values, earned trust, and proof that you can work through hard things together.",
      "Vest every founder, including yourself, four years with a one-year cliff.",
      "A good CFO protects the company from optimism. A great CFO also makes it possible to take the right risks quickly.",
      "Get the tax on your own equity right, because it can save or cost you a fortune. File your 83(b) within 30 days of receiving founder stock, or on day 31 the choice is gone. And hold qualifying C-corporation shares for five years, so QSBS can let you exclude the entire gain when you sell.",
      "Never take money, or a board seat, from someone you do not trust. Capital has a memory and eventually collects, and your board can fire you, so keep both small and full of people who have your back.",
      "Not every company needs venture money. Plumbing, transportation, and waste have minted more millionaires than pitch decks. But if you do raise, take only enough to reach the milestone that earns the next round, and never stack SAFEs, because both over-raising and piled-up notes quietly eat your ownership before you notice.",
      "Discounting is easy because it feels like closing. But every discount teaches your customer what your product is really worth.",
      "Pay great people well. Give them ownership when you can. People do not move mountains for a bonus. They move mountains when the mountain belongs to them.",
      "Use AI to stay small and profitable. The edge now is doing with five people what used to take fifty, so don't raise a fortune just to rebuild the old bloat.",
    ],
  },
  {
    roman: "VIII",
    eyebrow: "ON MOVING",
    titleLines: ["COUNTRIES"],
    shortName: "Moving Countries",
    fullName: "On Moving Countries",
    intro: [
      "I left India in 1990 for Bahrain, and Bahrain for America in 1995, with a wife, a young daughter, and whatever we could carry. During the Gulf War we taped our windows shut and kept a briefcase by the door, passports and a little cash inside, ready to run. In Michigan we started again from zero, the only brown family in a small, cold town, with no credit and no name. Each time, we rebuilt on the one thing no war and no border could take from us, the training in my hands and the knowledge in my head.",
    ],
    rules: [
      "A government can take your property. It can close your business. It can make you start over. But it cannot take the skill in your hands or the knowledge in your head. Those are the assets you carry across every border.",
      "Every immigrant has to learn a new language, a new culture, and a new tax code. Learn the tax code first. The government will ask where every dollar came from, even if you earned it before you arrived.",
      "Do not move all your money at once. Keep a foothold where you came from until you are sure the new country will have you.",
      "Learn the visa map before you pack. The O-1 and the EB-1A reward people who can prove they are exceptional, and you can now petition through your own company. The E-2 lets you buy in with a few hundred thousand dollars, but only if your country has a treaty, and India, China, Brazil, and Russia do not. The H-1B is a lottery you will probably lose, so never build your plan on it.",
      "Hire a lawyer who files your exact visa every week. Ask how many O-1s or waivers they filed last year. The wrong lawyer costs you the case and the years you cannot refile.",
      "Declare every account you keep back home once the total passes ten thousand dollars. The penalty for hiding it dwarfs whatever sat inside. This is the rule that quietly ruins honest immigrants.",
      "Get every document apostilled before you leave. Degrees, licenses, birth, marriage. Pulling one missing paper across an ocean later takes months you will not have.",
      "Every immigrant knows money does not cross borders as easily as people do. Stablecoins are the first dollars that can reach home like a text message. For families sending money back, that is not crypto. That is dignity.",
      "You are the easiest person in the country to cheat the day you arrive. The fake lawyer, the greedy landlord, the countryman with a sure thing, all of them wait for people who do not yet know the rules. Trust slowly and verify everyone.",
      "Find your people before you find anything else. They will tell you the right neighborhood, school, landlord, and lawyer faster than google search.",
    ],
  },
  {
    roman: "IX",
    eyebrow: "ON TIME BEING",
    titleLines: ["WORTH MORE", "THAN MONEY"],
    shortName: "Time Worth More Than Money",
    fullName: "On Time Being Worth More Than Money",
    intro: [
      "My father was alive in the morning and gone by night. I was twenty-five, and it changed what I believed about what is scarce. Years later I walked away from a comfortable life in Bahrain, free housing, no taxes and an easy job, because it was costing me years I would never get back. I spent a whole career counting money for other people, and the one thing I never saw anyone earn back was time.",
    ],
    rules: [
      "Everything has two prices, one in money and one in hours. Most people only check the first. The second is usually the one they regret.",
      "Decide what an hour of your work is worth. Then do not take jobs that pay less. Every hour you sell cheaply is an hour you cannot spend on work that pays well.",
      "Once you know what an hour of your time is worth, stop doing work that can be hired out for less. Cleaning, errands, admin, even the drive. A cheap task can still be expensive if it costs you your best hours.",
      "Say no by default and make people earn the yes.",
      "Answer email twice a day, not all day. Being reachable every minute just trains people to interrupt you.",
      "Never drive across town to save a few dollars. Run the math on your time before you run the errand.",
      "Automate or hand off anything you do more than a few times. Set it up once and stop paying for it in hours.",
      "Spend money to remove friction, not to pile up more stuff. Buy back the distance between you and your day.",
      "Take the direct flight. A cheaper ticket with a long layover costs a day you can't buy back.",
      "Put the people who matter on the calendar now, with a real date. Soon never gets scheduled.",
    ],
  },
  {
    roman: "X",
    eyebrow: "ON",
    titleLines: ["LEGACY"],
    shortName: "Legacy",
    fullName: "On Legacy",
    intro: [
      "I spent my career as an accountant, seeing what happened to people's money after they died. More often than not, fortunes fell apart when it came time to divide them. How someone leaves their wealth behind says far more than how they made it. When my own time came to think about legacy, I built a senior community in my hometown in India. I ran it for ten years, then gave it away instead of selling it because I wanted the people living there to keep being cared for. That decision taught me more about legacy than all my years dealing with other people's estates.",
    ],
    rules: [
      "Do not gift your most appreciated assets while you live. Hold them to the end, and when your heirs inherit them the tax on all those gains resets to zero. Give cash instead.",
      "Convert your traditional retirement money to a Roth before you die. Since the law changed, your children must empty an inherited account within ten years at full income tax, while a Roth passes to them tax-free.",
      "Set up a grantor trust and pay its income tax yourself. The taxman does not count that tax as a gift, so you move money to your heirs tax-free every year while shrinking your own estate.",
      "If your estate is big enough to owe the tax, hold the money in a dynasty trust in a state that allows one. It can run for generations with the estate tax never charged again. The very rich do not pay that tax. They structure around it.",
      "Gift minority shares of a family company instead of cash. They are valued at a discount for being hard to sell and control, so you move more wealth under the same exemption than the shares are truly worth.",
      "Never leave money in a child's own name. In the right trust it survives their divorce, their creditors, and their worst decade, and stays in the family.",
      "Own your life insurance inside a trust, not in your own name, or the payout is taxed as part of your estate. Held right, it covers the estate's tax bill so your family never has to sell the house or the business in a hurry.",
      "The highest return in all of estate planning is teaching your heirs to handle money together. Seventy percent of fortunes die from family conflict, not taxes, and no trust survives children who will not cooperate.",
      "Give some of it while you are alive. It is the only version of an inheritance you can still watch, teach, and correct.",
      "Decide what the money is for beyond your family. The wealth I am proudest of is the part I gave away, and it is the only part still doing good today.",
    ],
  },
];
