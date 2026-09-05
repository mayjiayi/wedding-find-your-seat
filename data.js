/* ============================================================
   WEDDING SEATING DATA
   ------------------------------------------------------------
   HOW TO EDIT (for your real seating later):
   - Each table has an "id", a "capacity" (8 or 12), and two
     long sides: "top" and "bottom".
   - 8-seat table  = 4 seats per side.
   - 12-seat table = 6 seats per side.
   - List seats left -> right along each side.
   - A seat is either:
        { "name": "Full Name", "party": "Group Name" }
     or  null   (for an empty seat)
   - "party" groups people who arrive/sit together. When a guest
     searches, everyone in THEIR party is shown by name; all other
     seats appear anonymous. Give members of the same group the
     exact same "party" text.
   - OPTIONAL "aliases": nicknames a guest might search by. The
     displayed name never changes, but any alias also finds them.
        { "name": "Elizabeth Tan", "party": "...", "aliases": ["Liz", "Beth"] }

   NOTE: This is MOCK data for testing the layout & features.
   ============================================================ */

window.SEATING_DATA = {
  tables: [
    // ---------- TABLE 1 (8 seats) — one party of 7 + 1 empty ----------
    {
      id: 1,
      capacity: 8,
      top: [
        { name: "Wei Tan", party: "Tan Family", aliases: ["Ah Wei", "Wei Wei"] },
        { name: "Mei Tan", party: "Tan Family" },
        { name: "Jun Tan", party: "Tan Family" },
        { name: "Li Tan", party: "Tan Family" }
      ],
      bottom: [
        { name: "Hao Tan", party: "Tan Family" },
        { name: "Xin Tan", party: "Tan Family" },
        { name: "Yi Tan", party: "Tan Family" },
        null
      ]
    },

    // ---------- TABLE 3 (8 seats) — two parties of 4 ----------
    {
      id: 3,
      capacity: 8,
      top: [
        { name: "Daniel Ong", party: "Ong Family" },
        { name: "Grace Ong", party: "Ong Family" },
        { name: "Ethan Ong", party: "Ong Family" },
        { name: "Chloe Ong", party: "Ong Family" }
      ],
      bottom: [
        { name: "Marcus Lee", party: "Lee Family" },
        { name: "Rachel Lee", party: "Lee Family" },
        { name: "Adam Lee", party: "Lee Family" },
        { name: "Sophie Lee", party: "Lee Family" }
      ]
    },

    // ---------- TABLE 5 (8 seats) — one full party of 8 ----------
    {
      id: 5,
      capacity: 8,
      top: [
        { name: "Nathan Goh", party: "Goh Family" },
        { name: "Olivia Goh", party: "Goh Family" },
        { name: "Lucas Goh", party: "Goh Family" },
        { name: "Emma Goh", party: "Goh Family" }
      ],
      bottom: [
        { name: "Ryan Goh", party: "Goh Family" },
        { name: "Zoe Goh", party: "Goh Family" },
        { name: "Aaron Goh", party: "Goh Family" },
        { name: "Mia Goh", party: "Goh Family" }
      ]
    },

    // ---------- TABLE 7 (8 seats) — party of 5 + party of 3 ----------
    {
      id: 7,
      capacity: 8,
      top: [
        { name: "Ben Kwan", party: "College Crew", quip: "Will insist he knew about it first." },
        {
          name: "Kayla Sim",
          party: "College Crew",
          quip: "Runs entirely on iced coffee and chaos."
        },
        { name: "Josh Chua", party: "College Crew", quip: "Ask him about the karaoke incident." },
        { name: "Ivan Ho", party: "College Crew" }
      ],
      bottom: [
        { name: "Priya Nair", party: "College Crew" },
        { name: "Faisal Rahman", party: "Neighbours" },
        { name: "Nurul Aini", party: "Neighbours" },
        { name: "Siti Zahra", party: "Neighbours" }
      ]
    },

    // ---------- TABLE 9 (8 seats) — party of 6 + 2 empty ----------
    {
      id: 9,
      capacity: 8,
      top: [
        { name: "Alan Teo", party: "Work Friends" },
        { name: "Bernice Koh", party: "Work Friends" },
        { name: "Cheryl Ang", party: "Work Friends" },
        { name: "Derek Lau", party: "Work Friends" }
      ],
      bottom: [
        { name: "Elaine Foo", party: "Work Friends" },
        { name: "Gary Seah", party: "Work Friends" },
        null,
        null
      ]
    },

    // ---------- TABLE 11 (8 seats) — one full party of 8 ----------
    {
      id: 11,
      capacity: 8,
      top: [
        { name: "Hui Zhen", party: "Maersk MT" },
        { name: "Wei Jie", party: "Maersk MT" },
        { name: "Yi Chen", party: "Maersk MT" },
        { name: "Kok Wei", party: "Maersk MT" }
      ],
      bottom: [
        null,
        { name: "Liying", party: "Maersk MT" },
        { name: "Shiya", party: "Maersk MT" },
        { name: "Zach", party: "Maersk MT" }
      ]
    },

    // ---------- TABLE 2 (12 seats) — one full party of 12 ----------
    {
      id: 2,
      capacity: 12,
      top: [
        { name: "Jasmine Ng", party: "Extended Family" },
        { name: "John Ng", party: "Extended Family" },
        { name: "Terence Wong", party: "Extended Family" },
        { name: "Ursula Wong", party: "Extended Family" },
        { name: "Victor Wong", party: "Extended Family" },
        { name: "Wendy Wong", party: "Extended Family" }
      ],
      bottom: [
        { name: "Xavier Wong", party: "Extended Family" },
        { name: "Yasmin Wong", party: "Extended Family" },
        { name: "Zachary Wong", party: "Extended Family" },
        { name: "Amanda Wong", party: "Extended Family" },
        { name: "Brian Wong", party: "Extended Family" },
        { name: "Carmen Wong", party: "Extended Family" }
      ]
    },

    // ---------- TABLE 4 (12 seats) — party of 7 + party of 5 ----------
    {
      id: 4,
      capacity: 12,
      top: [
        { name: "Dylan Png", party: "Church Group" },
        { name: "Evelyn Sng", party: "Church Group" },
        { name: "Farah Idris", party: "Church Group" },
        { name: "Gerald Tay", party: "Church Group" },
        { name: "Hannah Boey", party: "Church Group" },
        { name: "Isaac Quek", party: "Church Group" }
      ],
      bottom: [
        { name: "Jolene Yeo", party: "Church Group" },
        { name: "Kenneth Chai", party: "Poly Mates", aliases: ["Ken", "Kenny"] },
        { name: "Lydia Soh", party: "Poly Mates" },
        { name: "Malcolm Tng", party: "Poly Mates" },
        { name: "Natalie Chow", party: "Poly Mates" },
        { name: "Owen Lam", party: "Poly Mates" }
      ]
    },

    // ---------- TABLE 6 (12 seats) — two parties of 6 ----------
    {
      id: 6,
      capacity: 12,
      top: [
        { name: "Patrick Neo", party: "Sec School" },
        { name: "Queenie Yap", party: "Sec School" },
        { name: "Rayan Ali", party: "Sec School" },
        { name: "Serena Chin", party: "Sec School" },
        { name: "Tobias Ng", party: "Sec School" },
        { name: "Una Chern", party: "Sec School" }
      ],
      bottom: [
        { name: "Vincent Fong", party: "Cousins" },
        { name: "Winnie Loh", party: "Cousins" },
        { name: "Xander Poh", party: "Cousins" },
        { name: "Yvette Guan", party: "Cousins" },
        { name: "Zoe Chik", party: "Cousins" },
        { name: "Aiden Roy", party: "Cousins" }
      ]
    },

    // ---------- TABLE 8 (12 seats) — party of 10 + 2 empty ----------
    {
      id: 8,
      capacity: 12,
      top: [
        { name: "Bella Moktar", party: "Family Friends" },
        { name: "Caleb Sng", party: "Family Friends" },
        { name: "Denise Yap", party: "Family Friends" },
        { name: "Elliot Tan", party: "Family Friends" },
        { name: "Fiona Lee", party: "Family Friends" },
        { name: "Gavin Ong", party: "Family Friends" }
      ],
      bottom: [
        { name: "Heidi Lim", party: "Family Friends" },
        { name: "Ian Chua", party: "Family Friends" },
        { name: "Janet Soh", party: "Family Friends" },
        { name: "Kelvin Ow", party: "Family Friends" },
        null,
        null
      ]
    },

    // ---------- TABLE 10 (12 seats) — one full party of 12 ----------
    {
      id: 10,
      capacity: 12,
      top: [
        { name: "Kai Xin", party: "Bride's SSF" },
        { name: "Wei En", party: "Bride's SSF" },
        { name: "Yi Cheng", party: "Bride's SSF" },
        { name: "Jie Wu", party: "Bride's SSF" },
        { name: "Duan Jian", party: "Bride's SSF" },
        { name: "Tengjie", party: "Bride's SSF" }
      ],
      bottom: [
        { name: "Xue Yi", party: "Bride's SSF" },
        { name: "Yong Han", party: "Bride's SSF" },
        { name: "Gin Ling", party: "Bride's SSF" },
        { name: "Ivy", party: "Bride's SSF" },
        { name: "Siew Hwee", party: "Bride's SSF" },
        { name: "Sherlyn", party: "Bride's SSF" }
      ]
    },

    // ---------- TABLE 12 (12 seats) — party of 8 + party of 4 ----------
    {
      id: 12,
      capacity: 12,
      top: [
        { name: "Ping Teng", party: "Groom's SSF" },
        { name: "Jillian", party: "Groom's SSF" },
        { name: "Claudia", party: "Groom's SSF" },
        { name: "Kevin Lau", party: "Bride's Side" },
        { name: "Valerie Chua", party: "Bride's Side" },
        { name: "Nicholas Goh", party: "Bride's Side" }
      ],
      bottom: [
        { name: "Shi Jun", party: "Groom's SSF" },
        { name: "Darren", party: "Groom's SSF" },
        { name: "Richie", party: "Groom's SSF" },
        { name: "Jasmine Koh", party: "Plus Ones" },
        { name: "Ravi Menon", party: "Plus Ones" },
        { name: "Tara Iyer", party: "Plus Ones" }
      ]
    }
  ]
};

/* ============================================================
   CUTE CONTENT (easter eggs) — all editable text lives here.
   ------------------------------------------------------------
   - facts:      random one-liners shown on the landing page.
   ============================================================ */

window.WEDDING_CONTENT = {
  // A fact is either a plain string (shared "we" fact, no signature) or
  // { text, by } to sign it with "— May" / "— Junyu".
  // Order is interleaved so signatures alternate — a signed fact is always
  // separated by a "we" fact, and May/Junyu never appear back-to-back (the
  // list wraps, so the last -> first transition is checked too).
  facts: [
    "We celebrated our 9th anniversary just 2 days ago!!!!!",
    {
      text: "May built this website from scratch! With some help from her second best friend, Claude. I'm her first.",
      by: "Junyu"
    },
    "Switzerland was both our dream destination since young. 10/10 would go broke again.",
    { text: "Junyu never liked lady's fingers until he met me!!!!", by: "May" },
    "The first thing we're doing when we move into our new home is binge-watching every Marvel movie before Doomsday.",
    { text: "I'm the dishwasher in this relationship.", by: "Junyu" },
    "On a 5-day Penang trip, we ate char kway teow AND fried oyster every. single. day.",
    {
      text: "If we're ever stranded on an island, Junyu will keep us alive. I will keep him entertained with my funny jokes.",
      by: "May"
    },
    "We love to nap, eat, and go on walks. Are we dogs?",
    {
      text: "Our first big purchase together was an iPad. Then somehow it became May's.",
      by: "Junyu"
    },
    "We can tell the gender of a pigeon just by looking at it. Test us. We are always ready.",
    {
      text: "Thanks to Junyu, I never had to peel fried chicken since we started dating hehe",
      by: "May"
    },
    "Junyu cannot remember song lyrics even if his life depended on it.",
    {
      text: "May thinks she's the funnier one in the relationship, but I don't agree.......",
      by: "Junyu"
    },
    "The wedding playlist you're hearing has been in the making since 2020. 6 years ago!",
    {
      text: 'I always eat the "safe choice" food everywhere we go. Junyu orders random things.',
      by: "May"
    }
  ],

  // Tapping a seat shows a funny line. Add an optional "quip" to any guest below
  // (in the tables) for a custom one. Guests without a quip get a random
  // fallback from here; anonymous seats (other groups) get a mystery line.
  defaultQuips: [
    "One of our favourite people.",
    "Ask them how we met — worth it.",
    "Guaranteed excellent company.",
    "Trust us, a great one to sit beside."
  ],
  mysteryLines: [
    "A guest you'll meet tonight.",
    "A friendly face from across the room.",
    "Someone worth wandering over to say hi to."
  ],

  // ---- "Who's more likely to…" game ----
  // Each item: prompt (the "..." after "Who's more likely to…"), the answer
  // ("May", "Junyu", or "Both" — Both counts either tap as a match), and an
  // optional witty reveal caption.
  // The questions play in THIS order (starting on a random one, then looping),
  // so arrange them here to get the flow you want.
  whoMoreLikely: [
    {
      prompt: 'say "anything" for dinner, then reject every suggestion',
      answer: "May",
      note: "And somehow nothing is ever quite right."
    },
    {
      prompt: "walk 15 minutes just to save $2",
      answer: "Both",
      note: "A $2 saving is a $2 saving."
    },
    {
      prompt: "check the Grab price and suddenly decide MRT isn't that bad",
      answer: "Junyu",
      note: "The MRT suddenly looks very appealing."
    },
    {
      prompt: 'say "so expensive" and buy it anyway',
      answer: "May",
      note: "Expensive, yes. Bought, also yes."
    },
    {
      prompt: "order the exact same thing at the hawker centre every time",
      answer: "May",
      note: "Why fix what isn't broken?"
    },
    {
      prompt: "get us lost despite having Google Maps open",
      answer: "Junyu",
      note: "The map says left. Junyu goes right."
    },
    {
      prompt: "know exactly which credit card to use for the purchase",
      answer: "Junyu",
      note: "Our miles king!!!"
    }
  ]
};
