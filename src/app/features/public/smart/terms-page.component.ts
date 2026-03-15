import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mc-terms-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <h1 class="text-3xl lg:text-4xl text-foreground mb-4">Terms of Service</h1>
      <p class="text-muted-foreground mb-8">Last updated: March 1, 2026</p>

      <div class="prose prose-gray max-w-none">
        @for (section of sections; track section.title) {
          <section class="mb-8">
            <h2 class="text-xl text-foreground font-medium mb-4">{{ section.title }}</h2>
            <div class="text-muted-foreground space-y-3">
              @for (paragraph of section.content; track paragraph) {
                <p>{{ paragraph }}</p>
              }
            </div>
          </section>
        }
      </div>

      <div class="mt-12 p-6 bg-muted/50 rounded-lg">
        <h3 class="text-foreground font-medium mb-2">Questions?</h3>
        <p class="text-muted-foreground text-sm">
          If you have any questions about these Terms, please contact us at
          <a href="mailto:legal@mentorchief.com" class="text-primary hover:underline">legal&#64;mentorchief.com</a>
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsPageComponent {
  readonly sections = [
    {
      title: '1. Acceptance of Terms',
      content: [
        'By accessing and using Mentorchief, you agree to be bound by these Terms of Service and all applicable laws and regulations.',
        'If you do not agree with any of these terms, you are prohibited from using or accessing this platform.',
      ],
    },
    {
      title: '2. User Accounts',
      content: [
        'You must be at least 18 years old to create an account on Mentorchief.',
        'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
        'You agree to provide accurate, current, and complete information during registration.',
      ],
    },
    {
      title: '3. Mentorship Services',
      content: [
        'Mentorchief provides a platform connecting mentors and mentees. We do not guarantee specific outcomes from mentorship relationships.',
        'Mentors are independent professionals and not employees of Mentorchief.',
        'Both mentors and mentees agree to conduct themselves professionally and respectfully.',
      ],
    },
    {
      title: '4. Payment Terms',
      content: [
        'All payments are processed through our secure payment system and held in escrow until mentorship periods complete.',
        'Platform fees are deducted from mentor payments as disclosed in the mentor agreement.',
        'Refunds are available within the first 3 days of a new mentorship as per our refund policy.',
      ],
    },
    {
      title: '5. Escrow Protection',
      content: [
        'All mentee payments are held in escrow for the duration of the mentorship period.',
        'Funds are released to mentors upon successful completion of the mentorship period.',
        'In case of disputes, Mentorchief will mediate and make final decisions regarding fund distribution.',
      ],
    },
    {
      title: '6. Prohibited Conduct',
      content: [
        'Users may not use the platform for any illegal purposes or to violate any laws.',
        'Users may not harass, abuse, or harm other users.',
        'Users may not attempt to circumvent the platform\'s payment system.',
        'Users may not share account credentials or create multiple accounts.',
      ],
    },
    {
      title: '7. Intellectual Property',
      content: [
        'All content shared during mentorship sessions remains the intellectual property of the respective parties.',
        'Users grant Mentorchief a limited license to use testimonials and reviews for marketing purposes.',
      ],
    },
    {
      title: '8. Limitation of Liability',
      content: [
        'Mentorchief is not liable for any indirect, incidental, or consequential damages arising from use of the platform.',
        'Our total liability shall not exceed the amount paid by you in the past 12 months.',
      ],
    },
    {
      title: '9. Changes to Terms',
      content: [
        'We reserve the right to modify these terms at any time. Users will be notified of significant changes.',
        'Continued use of the platform after changes constitutes acceptance of the new terms.',
      ],
    },
  ];
}
