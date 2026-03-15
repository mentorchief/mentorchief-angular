import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mc-privacy-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <h1 class="text-3xl lg:text-4xl text-foreground mb-4">Privacy Policy</h1>
      <p class="text-muted-foreground mb-8">Last updated: March 1, 2026</p>

      <div class="prose prose-gray max-w-none">
        <p class="text-muted-foreground mb-8">
          At Mentorchief, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.
        </p>

        @for (section of sections; track section.title) {
          <section class="mb-8">
            <h2 class="text-xl text-foreground font-medium mb-4">{{ section.title }}</h2>
            <div class="text-muted-foreground space-y-3">
              @for (paragraph of section.content; track paragraph) {
                <p>{{ paragraph }}</p>
              }
              @if (section.list) {
                <ul class="list-disc list-inside space-y-1">
                  @for (item of section.list; track item) {
                    <li>{{ item }}</li>
                  }
                </ul>
              }
            </div>
          </section>
        }
      </div>

      <div class="mt-12 p-6 bg-muted/50 rounded-lg">
        <h3 class="text-foreground font-medium mb-2">Contact Us</h3>
        <p class="text-muted-foreground text-sm">
          For privacy-related inquiries, please contact our Data Protection Officer at
          <a href="mailto:privacy@mentorchief.com" class="text-primary hover:underline">privacy&#64;mentorchief.com</a>
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPageComponent {
  readonly sections = [
    {
      title: '1. Information We Collect',
      content: ['We collect information you provide directly to us, including:'],
      list: [
        'Account information (name, email, password)',
        'Profile information (bio, expertise, photo)',
        'Payment information (processed securely by our payment provider)',
        'Communication data (messages between users)',
        'Usage data (how you interact with our platform)',
      ],
    },
    {
      title: '2. How We Use Your Information',
      content: ['We use the information we collect to:'],
      list: [
        'Provide, maintain, and improve our services',
        'Process transactions and send related information',
        'Send notifications about your account and mentorships',
        'Respond to your comments, questions, and support requests',
        'Detect and prevent fraud and abuse',
      ],
    },
    {
      title: '3. Information Sharing',
      content: [
        'We do not sell your personal information to third parties.',
        'We may share your information with:',
      ],
      list: [
        'Other users as necessary for mentorship (e.g., mentors see mentee profiles)',
        'Service providers who assist in operating our platform',
        'Law enforcement when required by law',
      ],
    },
    {
      title: '4. Data Security',
      content: [
        'We implement industry-standard security measures to protect your data.',
        'All data is encrypted in transit using TLS and at rest using AES-256.',
        'We regularly audit our security practices and conduct penetration testing.',
      ],
    },
    {
      title: '5. Data Retention',
      content: [
        'We retain your personal information for as long as your account is active.',
        'Upon account deletion, we will delete or anonymize your data within 30 days.',
        'Some information may be retained longer for legal or business purposes.',
      ],
    },
    {
      title: '6. Your Rights',
      content: ['You have the right to:'],
      list: [
        'Access your personal information',
        'Correct inaccurate data',
        'Delete your account and associated data',
        'Export your data in a portable format',
        'Opt out of marketing communications',
      ],
    },
    {
      title: '7. Cookies',
      content: [
        'We use cookies and similar technologies to improve your experience.',
        'You can control cookie preferences through your browser settings.',
        'Essential cookies are required for the platform to function properly.',
      ],
    },
    {
      title: '8. International Transfers',
      content: [
        'Your data may be transferred to and processed in countries other than your own.',
        'We ensure appropriate safeguards are in place for international data transfers.',
      ],
    },
    {
      title: '9. Changes to This Policy',
      content: [
        'We may update this privacy policy from time to time.',
        'We will notify you of significant changes via email or platform notification.',
      ],
    },
  ];
}
