export interface Experience {
  company: string;
  role: string;
  period: string;
  location: string;
  description: string;
  achievements: string[];
}

export interface Project {
  title: string;
  url: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  imageUrls?: string[];
}

export interface ResumeData {
  personalInfo: {
    name: string;
    title: string;
    location: string;
    email: string;
    phone: string;
    linkedin: string;
    portfolio: string;
    company: string;
    summary: string;
  };
  skills: {
    category: string;
    items: string[];
  }[];
  experience: Experience[];
  education: {
    school: string;
    period: string;
    degree: string;
  }[];
  projects: Project[];
}

export const resumeData: ResumeData = {
  personalInfo: {
    name: "Brad Foster",
    title: "Lead Web Developer | AI Developer | Technical Architect",
    location: "Rochdale, United Kingdom",
    email: "brad@compsmart.co.uk",
    phone: "07814401867",
    linkedin: "https://www.linkedin.com/in/bradfoster84",
    portfolio: "http://www.bradfoster.co.uk",
    company: "http://www.compsmart.co.uk",
    summary: "Innovative Lead Web Developer with over 20 years of experience creating secure, scalable web applications and IT systems. Proven track record in full-stack development, transitioning legacy codebases to modern architectures, and mentoring cross-functional teams. Passionate about cutting-edge technology, with expertise in developing agentic AI applications."
  },
  skills: [
    {
      category: "Languages & Frameworks",
      items: ["Angular", "Node", "PHP/Laravel", "React", "TypeScript", "Python"]
    },
    {
      category: "Database & Storage",
      items: ["Microsoft SQL Server", "Database Optimization & Design", "MySQL", "MongoDB"]
    },
    {
      category: "DevOps & Cloud",
      items: ["Azure DevOps", "Docker", "Kubernetes", "Octopus Deploy", "Hyper-V", "CI/CD Pipelines", "AWS"]
    },
    {
      category: "Architecture & Systems",
      items: ["Event-Driven Architecture (RabbitMQ)", "Microservices", "RESTful API Design", "SaaS Development"]
    },
    {
      category: "AI & Emerging Tech",
      items: ["Gemini API", "Autonomous Agents", "LLM Integration", "Interactive Games"]
    }
  ],
  experience: [
    {
      company: "Playtech",
      role: "Lead Web Developer",
      period: "March 2020 – Present",
      location: "Manchester, UK",
      description: "Leading the development of loyalty and marketing solutions for the gambling industry’s top technology provider.",
      achievements: [
        "Direct a team of developers using Azure DevOps and Agile methodologies to deliver robust gaming business applications.",
        "Architect secure, scalable web applications emphasizing event-driven systems using message queues (RabbitMQ).",
        "Engineered comprehensive CI/CD pipelines utilizing Docker, Kubernetes, Azure, and Octopus Deploy.",
        "Implemented rigorous testing automation and code review processes.",
        "Provide ongoing training and technical mentoring to colleagues and clients."
      ]
    },
    {
      company: "Intelligent Gaming",
      role: "CRM Developer",
      period: "September 2016 – March 2020",
      location: "Chadderton, UK",
      description: "Specialized in integrating SugarCRM with complex Casino Gaming Systems.",
      achievements: [
        "Created API endpoints to integrate disparate gaming systems with CRM platforms.",
        "Developed custom modules using PHP 5.4, IIS, and SQL Server 2014.",
        "Delivered critical business features including Player Preferences, Marketing Campaigns, and Host Notifications.",
        "Managed virtualization environments using Hyper-V for development and testing."
      ]
    },
    {
      company: "Call Centre Systems Ltd",
      role: "Lead Developer",
      period: "June 2016 – November 2016",
      location: "Greater Manchester, UK",
      description: "Oversaw the sales, support, and development of bespoke SaaS web applications.",
      achievements: [
        "Led the development of varied business software including Appointment Booking, Staff Management, and NPS Systems.",
        "Built Quality Control and Call Monitoring systems to enhance business operational efficiency."
      ]
    },
    {
      company: "121 Customer Insight",
      role: "Lead Developer",
      period: "July 2014 – June 2016",
      location: "Rochdale, UK",
      description: "Leading development of high-performance call center management systems.",
      achievements: [
        "Led a small team in developing QualityTracker and SmartProspector.",
        "Responsible for server maintenance, security patching, and database optimization.",
        "Managed website security, debugging, and patching to ensure data integrity."
      ]
    },
    {
      company: "IT Systems Developer",
      role: "IT Systems Developer",
      period: "February 2012 – July 2014",
      location: "",
      description: "Developed key internal tools and managed network infrastructure.",
      achievements: [
        "Developed Attendance Management, Field Sales iPad apps, and Data Processing applications.",
        "Managed internal network analysis, telephony infrastructure, and intranet systems."
      ]
    },
    {
      company: "Rochdale Website Design",
      role: "Web Designer (Freelance)",
      period: "December 2011 – May 2016",
      location: "Rochdale, UK",
      description: "Provided full-cycle web design and development services.",
      achievements: [
        "Provided full-cycle web design, development, SEO, and pre-sales consulting for diverse SME clients."
      ]
    },
    {
      company: "Zen Internet Limited",
      role: "Technical Support Consultant",
      period: "July 2008 – January 2012",
      location: "Rochdale, UK",
      description: "Provided comprehensive technical support for web hosting and broadband technologies.",
      achievements: [
        "Supported web hosting and broadband technologies for corporate customers."
      ]
    }
  ],
  education: [
    {
      school: "Hopwood Hall College",
      period: "2000 – 2004",
      degree: "AVCE ICT & Computer Science"
    }
  ],
  projects: [
    {
      title: "TamaPets",
      url: "https://tamapets.com",
      description: "An AI-powered virtual pet experience. Adopt, chat with, and nurture intelligent companions that learn and grow with you.",
      tags: ["AI", "Game Dev", "Web"],
      imageUrls: ["/images/tamapets-welcome.png", "/images/tamapets-screen.png", "/images/tamapets-options.png"]
    },
    {
      title: "Akinator AI",
      url: "https://ai.compsmart.co.uk",
      description: "An AI genie that reads minds! Think of a character and let the AI guess who you're thinking of through clever questions.",
      tags: ["AI", "Game", "Gemini"],
      imageUrl: "/images/akinator.png"
    },
    {
      title: "QuizBums",
      url: "https://quizbums.com",
      description: "Interactive multiplayer quiz platform with AI-generated questions. Host real-time quiz games with friends and family.",
      tags: ["Entertainment", "Multiplayer", "React"],
      imageUrls: ["/images/quizbums-home.png", "/images/quizbums-lobby.png"]
    },
    {
      title: "ReportBuddy",
      url: "https://reportbuddy.co.uk",
      description: "Natural language reporting tool. Ask questions about your data in plain English and get instant insights.",
      tags: ["AI", "SaaS", "Analytics"],
      imageUrl: "/images/reportbuddy.png"
    },
    {
      title: "CompSmart",
      url: "https://compsmart.co.uk",
      description: "AI powered web development and hosting company.",
      tags: ["Hosting", "Services", "Business"],
      imageUrl: "/images/compsmart.png"
    }
  ]
};

