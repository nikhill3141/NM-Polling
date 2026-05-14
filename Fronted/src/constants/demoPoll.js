// Demo data powers the landing preview and empty dashboard state without requiring the API.
export const demoPoll = {
  id: "demo",
  title: "Product launch priority",
  description: "A sample result board showing how NM Polling turns audience answers into decisions.",
  status: "active",
  totalResponses: 248,
  link: {
    token: "nm-demo",
    publicUrl: "http://localhost:5173/polls/nm-demo",
    isPublished: true,
  },
  questions: [
    {
      id: "q1",
      questionText: "Which feature should ship first?",
      totalResponses: 248,
      options: [
        { id: "o1", optionText: "Live result wall", responseCount: 91, percentage: 37 },
        { id: "o2", optionText: "Device vote guard", responseCount: 72, percentage: 29 },
        { id: "o3", optionText: "Creator analytics", responseCount: 55, percentage: 22 },
      ],
    },
  ],
};

export const landingFlows = [
  {
    key: "create",
    label: "Create",
    title: "Build the question",
    text: "Add focused questions, options, expiry, and response rules in a compact creator dashboard.",
    metric: "30 sec",
  },
  {
    key: "share",
    label: "Share",
    title: "Send one clean link",
    text: "Every poll gets a public token link that works across devices without setup friction.",
    metric: "1 link",
  },
  {
    key: "publish",
    label: "Publish",
    title: "Reveal results when ready",
    text: "Keep results private while people vote, then publish a visual board for everyone.",
    metric: "Live",
  },
];
