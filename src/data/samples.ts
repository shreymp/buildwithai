// Example messages for trying Tipoff. All people, companies, handles and numbers are
// fictional, and each sample is labelled as an example in the UI. The scam samples
// follow scripts the FTC has described publicly; they are not real victims' messages.

export interface Sample {
  id: string;
  label: string;
  kind: 'scam' | 'legit';
  /** Shown under the chip so it's clear what the sample is. */
  note: string;
  /** For conversations: the messages, revealed one by one in "step through" mode. */
  lines: string[];
}

export const SAMPLES: Sample[] = [
  {
    id: 'fake-check-thread',
    label: 'Remote data entry offer',
    kind: 'scam',
    note: 'A conversation that starts as a recruiter text',
    lines: [
      'Dana: Hi Maya! This is Dana Reyes, a recruiter with Northfield Data Services. We came across your resume and think you’d be a great fit for a remote Data Entry Clerk role. $42/hr, flexible hours, no experience needed. To continue, please add our hiring manager on Telegram: @northfield_hr',
      'Me: Hi Dana, thanks! I just added him.',
      'Dana: Great. Mr. Collins will interview you on Telegram in a few minutes. Please answer each question in full sentences.',
      'Dana: Congratulations Maya, you passed the interview and you’ve been hired! You start Monday.',
      'Dana: To get you set up, we’ll mail you a company check for $2,850 to buy your laptop and software from our approved vendor. Use mobile deposit as soon as it arrives.',
      'Dana: The check cleared on your end! Now send $2,400 to the vendor through Zelle and keep the rest for your time. Please don’t tell your bank it’s for work equipment, it slows things down.',
    ],
  },
  {
    id: 'task-scam',
    label: 'Earn by rating hotels',
    kind: 'scam',
    note: 'A WhatsApp message about app “tasks”',
    lines: [
      'Lily: Hello! I’m Lily from Orbitly Media 😊 We’re hiring part-time online staff. Simple tasks: rate hotels in our app and earn commission on every task, about $150-$400 a day. Only 30 minutes a day from your phone. Interested?',
      'Me: What do I need to do?',
      'Lily: Your mentor will guide you through your first set of 40 tasks today. When you get a combo task your account goes negative, so you recharge your balance with USDT to unlock the next tasks and then withdraw everything.',
    ],
  },
  {
    id: 'training-fee',
    label: 'Moderator job with a training kit',
    kind: 'scam',
    note: 'An email offer that comes with a cost',
    lines: [
      'Hello Priya, congratulations, you’ve been hired as a remote Course Moderator at Redwater Learning ($4,100/month). Before your first day you need to complete our certification. The training kit costs $280 and is fully refundable after your first paycheck. You can pay the training fee by Zelle or gift cards to our coordinator, harper.redwater.hr@gmail.com.',
    ],
  },
  {
    id: 'identity-form',
    label: 'Assistant job, “payroll setup”',
    kind: 'scam',
    note: 'A text that asks for documents right away',
    lines: [
      'Hi Jordan, this is Mark from Pinecrest Logistics. Your resume was selected for our remote Administrative Assistant position. The interview will be conducted via text. You’ve been hired! To set up payroll, fill out the new hire form at forms.gle/pinecrest-onboard and reply with a photo of your driver’s license (front and back) and your SSN.',
    ],
  },
  {
    id: 'legit-recruiter',
    label: 'Interview invite after applying',
    kind: 'legit',
    note: 'A typical genuine recruiter email',
    lines: [
      'Hi Sam, thank you for applying to the Junior Data Analyst role (Req #4471) at Halverson Foods. We’d like to schedule a 30-minute video interview with the hiring manager, Ana Ortiz, next week. Please pick a time on the scheduling link in your candidate portal. If we move forward, you’ll receive a written offer and complete onboarding paperwork in Workday. We will never ask for payment or your Social Security number by text or email.',
    ],
  },
  {
    id: 'legit-linkedin',
    label: 'LinkedIn message from a recruiter',
    kind: 'legit',
    note: 'A genuine first contact you didn’t apply for',
    lines: [
      'Hi Alex, I’m a recruiter at Corvid Health. I saw your profile and think you could be a good fit for our Patient Support Specialist role ($21/hr, remote within the US). Would you have 15 minutes for a phone screen this week? Here’s the posting on our careers site so you can read the details first.',
    ],
  },
  {
    id: 'legit-background-check',
    label: 'Background check after an offer',
    kind: 'legit',
    note: 'A genuine email that asks for your SSN the right way',
    lines: [
      'Hi Morgan, congratulations again on accepting our offer for the Billing Specialist role at Orchard Dental Group. The next step is a background check. You’ll get an email from Northgate Screening, our screening partner, asking you to consent and enter your Social Security number in their secure portal. The check is at no cost to you. After that, HR will send your Workday invitation to set up direct deposit. Thanks, Priya Shah, Talent Team, Orchard Dental Group',
    ],
  },
];

export const sampleText = (s: Sample, upTo = s.lines.length): string => s.lines.slice(0, upTo).join('\n');
