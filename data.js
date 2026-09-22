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

   ------------------------------------------------------------
   ORDER OF THIS FILE: tables appear in the order guests see them
   — VIP table first, then Table 1 through Table 11.

   HEADS UP — "id" is NOT the number shown to guests. The id is the
   app's internal handle (it keys seat lookups and the room map, so
   never renumber it). Table 2 is shown as the "VIP Table" with no
   number, so every id above it displays one lower:

        id 1  -> "Table 1"        id 7  -> "Table 6"
        id 2  -> "VIP Table"      id 8  -> "Table 7"
        id 3  -> "Table 2"        id 9  -> "Table 8"
        id 4  -> "Table 3"        id 10 -> "Table 9"
        id 5  -> "Table 4"        id 11 -> "Table 10"
        id 6  -> "Table 5"        id 12 -> "Table 11"

   Each block's comment gives the guest-facing name first, then the
   id — so edit by the heading, not the id. The mapping itself lives
   in app.js (VIP_ID / tableShort / tableLabel).

   NOTE: All 12 tables hold REAL guest data. No mock/placeholder
   blocks remain. A few SEATS are still relationship labels rather
   than names (Bride, Groom, 2nd Ah Pei, 2nd Ahm, and son/wife/
   daughter/big uhm on Table 7) - those guests cannot search for
   themselves until real names are filled in.
   ============================================================ */

window.SEATING_DATA = {
  tables: [
    // ---------- VIP TABLE  (id 2, 12 seats, 12 filled) — real guests ----------
    {
      id: 2,
      capacity: 12,
      top: [
        { name: "Yi Chaw", party: "VIP Table" },
        { name: "Maung Myint Lwin", party: "VIP Table", aliases: ["May dad"] },
        { name: "Bride", party: "VIP Table", aliases: ["May"] },
        { name: "Groom", party: "VIP Table", aliases: ["Junyu"] },
        { name: "Ong Jun Hao", party: "VIP Table" },
        { name: "陈一猛", party: "VIP Table" }
      ],
      bottom: [
        { name: "Mabel Cho", party: "VIP Table" },
        { name: "Daw Cho Cho Aung", party: "VIP Table", aliases: ["May mum"] },
        { name: "Chen Dao Fang", party: "VIP Table", aliases: ["junyu mum"] },
        { name: "Ong Cheong Hong", party: "VIP Table", aliases: ["junyu dad"] },
        { name: "Jasmine Ong Jie Min", party: "VIP Table" },
        { name: "陈晓彤", party: "VIP Table" }
      ]
    },

    // ---------- TABLE 1  (id 1, 8 seats, 8 filled) — real guests ----------
    {
      id: 1,
      capacity: 8,
      top: [
        { name: "Aye Set Moe", party: "Table 1" },
        { name: "Kyi Zin Thant", party: "Table 1" },
        { name: "Thant Htoo Zaw", party: "Table 1" },
        { name: "Daw Tin Tin Win", party: "Table 1", aliases: ["May grandmother"] }
      ],
      bottom: [
        { name: "Andrew Aung", party: "Table 1" },
        { name: "Bella Chen", party: "Table 1" },
        { name: "Khin Shwe", party: "Table 1" },
        { name: "U Aung Min", party: "Table 1", aliases: ["May grandfather"] }
      ]
    },

    // ---------- TABLE 2  (id 3, 8 seats, 8 filled) — real guests ----------
    {
      id: 3,
      capacity: 8,
      top: [
        { name: "Khin Khin Aye", party: "Table 2" },
        { name: "Than Htay", party: "Table 2" },
        { name: "Ye Lin Naing", party: "Table 2" },
        { name: "Guan Guan", party: "Table 2" }
      ],
      bottom: [
        { name: "Ye Lin Htay", party: "Table 2" },
        { name: "Ye Lin Paing", party: "Table 2" },
        { name: "Cayli Lin", party: "Table 2" },
        { name: "Swe Myat Win", party: "Table 2" }
      ]
    },

    // ---------- TABLE 3  (id 4, 12 seats, 12 filled) — real guests ----------
    {
      id: 4,
      capacity: 12,
      top: [
        { name: "Soe Myint", party: "Table 3" },
        { name: "Han Htoo Zaw", party: "Table 3" },
        { name: "Thida Myint", party: "Table 3" },
        { name: "Yap Siew Tin", party: "Table 3" },
        { name: "2nd Ah Pei", party: "Table 3" },
        { name: "Jun Xiang", party: "Table 3" }
      ],
      bottom: [
        { name: "Moe Moe Aung", party: "Table 3" },
        { name: "Kyu Kyu", party: "Table 3" },
        { name: "Thaung Win", party: "Table 3" },
        { name: "Lim Siew Miu", party: "Table 3" },
        { name: "Lim Chwee Khoon", party: "Table 3" },
        { name: "2nd Ahm", party: "Table 3" }
      ]
    },

    // ---------- TABLE 4  (id 5, 8 seats, 8 filled) — real guests ----------
    {
      id: 5,
      capacity: 8,
      top: [
        { name: "Pho Ti", party: "Table 4" },
        { name: "Darryl Zhang", party: "Table 4" },
        { name: "Liam Ye Lin Pyae", party: "Table 4" },
        { name: "Ye Nay Lin", party: "Table 4" }
      ],
      bottom: [
        { name: "Li Na", party: "Table 4" },
        { name: "Chloe Zhang", party: "Table 4" },
        { name: "Hannah Lin Pyae", party: "Table 4" },
        { name: "Zin Hnin Phyu", party: "Table 4" }
      ]
    },

    // ---------- TABLE 5  (id 6, 12 seats, 12 filled) — real guests ----------
    {
      id: 6,
      capacity: 12,
      top: [
        { name: "Thye Chin Meih", party: "May JC" },
        { name: "Joyce Goh", party: "May JC" },
        { name: "Lim Si Jia", party: "Table 5" },
        { name: "Xiao Fen", party: "Table 5" },
        { name: "Jin Fu", party: "Table 5" },
        { name: "Ying Jie", party: "Table 5" }
      ],
      bottom: [
        { name: "Jasmine Tan", party: "May JC" },
        { name: "Michael Per", party: "May JC" },
        { name: "Clifford Teo", party: "Table 5" },
        { name: "Hailey Lim Si Wei", party: "Table 5" },
        { name: "Xiao Ping", party: "Table 5" },
        { name: "Xiao Yun", party: "Table 5" }
      ]
    },

    // ---------- TABLE 6  (id 7, 8 seats, 8 filled) — real guests ----------
    {
      id: 7,
      capacity: 8,
      top: [
        { name: "Aye Aye Min", party: "Table 6" },
        { name: "Winston Seow", party: "Table 6" },
        { name: "Tin Aung Kyaw", party: "Table 6" },
        { name: "Thein Naing", party: "Table 6" }
      ],
      bottom: [
        { name: "U San Win", party: "Table 6" },
        { name: "Cindy Chang", party: "Table 6" },
        { name: "Aye Aye Maw", party: "Table 6" },
        { name: "Moe Hpyu", party: "Table 6" }
      ]
    },

    // ---------- TABLE 7  (id 8, 12 seats, 12 filled) — real guests
    //            NOTE: 8 of these are relationship placeholders (son/wife/
    //            daughter/big uhm) rather than names — those guests cannot
    //            search for themselves until real names are filled in.
    {
      id: 8,
      capacity: 12,
      top: [
        { name: "Ah Yi Lan Lan", party: "Mum's guest" },
        { name: "Ng Thiam Soon", party: "Mum's guest" },
        { name: "son 3", party: "Table 7" },
        { name: "wife 3", party: "Table 7" },
        { name: "wife 1", party: "Table 7" },
        { name: "son 1", party: "Table 7" }
      ],
      bottom: [
        { name: "Ah Yi Yin Xin", party: "Mum's guest" },
        { name: "Koi Chin Hwa", party: "Mum's guest" },
        { name: "big uhm", party: "Table 7" },
        { name: "daughter", party: "Table 7" },
        { name: "wife 2", party: "Table 7" },
        { name: "son 2", party: "Table 7" }
      ]
    },

    // ---------- TABLE 8  (id 9, 8 seats, 8 filled) — real guests ----------
    {
      id: 9,
      capacity: 8,
      top: [
        { name: "Samantha Ng", party: "Table 8" },
        { name: "John Lim", party: "Table 8" },
        { name: "Timothy Shong", party: "Table 8" },
        { name: "Ang Yong Jia", party: "Table 8" }
      ],
      bottom: [
        { name: "Sophia Azli", party: "Table 8" },
        { name: "Nicholas Chua", party: "Table 8" },
        { name: "Pang Yu Shao", party: "Table 8" },
        { name: "Yeo Khai Sern", party: "Table 8" }
      ]
    },

    // ---------- TABLE 9  (id 10, 12 seats, 12 filled) — real guests ----------
    {
      id: 10,
      capacity: 12,
      top: [
        { name: "Fang Kai Xin", party: "Table 9" },
        { name: "Lee Wei En", party: "Table 9" },
        { name: "Chng Yi Cheng", party: "Table 9" },
        { name: "Ng Jie Wu", party: "Table 9" },
        { name: "Goh Duan Jian", party: "Table 9" },
        { name: "Yu Tengjie", party: "Table 9" }
      ],
      bottom: [
        { name: "Leong Xue Yi", party: "Table 9" },
        { name: "Hannah Wang", party: "Table 9" },
        { name: "Quek Gin Ling", party: "Table 9" },
        { name: "Ivy Xu", party: "Table 9" },
        { name: "Low Siew Hwee", party: "Table 9" },
        { name: "Sherlyn Low", party: "Table 9" }
      ]
    },

    // ---------- TABLE 10  (id 11, 8 seats, 7 filled) — real guests
    //            The 8th seat is empty; it sits at the end of the top row
    //            (only 3 names were given for that side).
    {
      id: 11,
      capacity: 8,
      top: [
        null,
        { name: "Tan Yi Chen", party: "Table 10" },
        { name: "Liu Hui Zhen", party: "Table 10" },
        { name: "Ta Shi Ya", party: "Table 10" }
      ],
      bottom: [
        { name: "Zachary Loo", party: "Table 10" },
        { name: "Tan Kok Wei", party: "Table 10" },
        { name: "Ong Wei Jie", party: "Table 10" },
        { name: "Thien Li Ying", party: "Table 10" }
      ]
    },

    // ---------- TABLE 11  (id 12, 12 seats, 12 filled) — real guests ----------
    {
      id: 12,
      capacity: 12,
      top: [
        { name: "Goh Ping Teng", party: "Table 11" },
        { name: "Jillian Ong", party: "Table 11" },
        { name: "Claudia Then", party: "Table 11" },
        { name: "Ryan Napili", party: "Table 11" },
        { name: "David Chng", party: "Table 11" },
        { name: "Low Hui Yuan", party: "Table 11" }
      ],
      bottom: [
        { name: "Long Shi Jun", party: "Table 11" },
        { name: "Darren Siew", party: "Table 11" },
        { name: "Richie Chit", party: "Table 11" },
        { name: "Michelle Booi", party: "Table 11" },
        { name: "Patricia Bianca Asis", party: "Table 11" },
        { name: "Su Shan", party: "Table 11" }
      ]
    }
  ]
};

window.WEDDING_CONTENT = {
  /* ============================================================
     ALL EDITABLE WORDING LIVES IN THIS FILE.
     Change anything below and refresh — no other file to touch.

     ONE EXCEPTION: the link-preview tags in index.html (og:title,
     og:description, the <title>, and the description meta). Those are
     read by WhatsApp/Facebook/Google, which do NOT run JavaScript, so
     they cannot be driven from here. If you change "names", "date" or
     "venue" below, update those four lines in index.html to match.
     ============================================================ */

  // ---- The details of this wedding ----
  details: {
    names: "Junyu & May",
    date: "26 September 2026",
    venue: "The Secret Haven",
    welcome: "You made it! Let's find your seat.",
    searchPlaceholder: "Start typing your name…",
    factsLabel: "Did you know?",
    // Shown on every seat card, just under the room map.
    seatedBy: "12.20pm"
  },

  // ---- Wording used around the app ----
  labels: {
    noMatch: "Can't find your name? Check the spelling, or please ask one of our ushers.",
    tableBadge: "You're at",
    seatBy: "Please be seated by",       // the time itself is details.seatedBy
    seeSeat: "See your exact seat",
    swipeHint: "Swipe to see the whole table →",
    otherGuests: "Other guests at your table",
    gameKicker: "While you wait…",
    gameTitle: "Play “Who's more likely to…”",
    gameNext: "Next",
    gameResults: "See results",
    gameAgain: "Play again"
  },

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
