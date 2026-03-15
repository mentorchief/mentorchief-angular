import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { RegistrationLayoutComponent } from './core/layout/registration-layout.component';
import { DashboardLayoutComponent } from './core/layout/dashboard-layout.component';
import { LandingPageComponent } from './features/public/smart/landing-page.component';
import { LoginPageComponent } from './features/auth/smart/login-page.component';
import { SignupPageComponent } from './features/auth/smart/signup-page.component';
import { ForgotPasswordPageComponent } from './features/auth/smart/forgot-password-page.component';
import { ResetPasswordPageComponent } from './features/auth/smart/reset-password-page.component';
import { VerifyEmailPageComponent } from './features/auth/smart/verify-email-page.component';
import { RoleInfoPageComponent } from './features/registration/smart/role-info-page.component';
import { PersonalInfoPageComponent } from './features/registration/smart/personal-info-page.component';
import { CareerInfoPageComponent } from './features/registration/smart/career-info-page.component';
import { BiographyPageComponent } from './features/registration/smart/biography-page.component';
import { PreferencePageComponent } from './features/registration/smart/preference-page.component';
import { PreviewPageComponent } from './features/registration/smart/preview-page.component';
import { MenteeDashboardComponent } from './features/dashboard/mentee-dashboard.component';
import { MentorDashboardComponent } from './features/dashboard/mentor-dashboard.component';
import { AdminDashboardComponent } from './features/dashboard/admin-dashboard.component';
import { BrowseMentorsPageComponent } from './features/public/smart/browse-mentors-page.component';
import { MentorProfilePageComponent } from './features/public/smart/mentor-profile-page.component';
import { MentorReviewsPageComponent } from './features/public/smart/mentor-reviews-page.component';
import { authGuard, registrationGuard, roleGuard, mentorApprovalGuard, guestGuard } from './core/guards/auth.guard';

// Mentee dashboard pages
import { MyMentorsPageComponent } from './features/dashboard/mentee/my-mentors-page.component';
import { MenteeMessagesPageComponent } from './features/dashboard/mentee/messages-page.component';
import { MenteePaymentsPageComponent } from './features/dashboard/mentee/payments-page.component';
import { MenteeReportsPageComponent } from './features/dashboard/mentee/reports-page.component';
import { MenteeSettingsPageComponent } from './features/dashboard/mentee/settings-page.component';

// Mentor dashboard pages
import { MyMenteesPageComponent } from './features/dashboard/mentor/my-mentees-page.component';
import { MentorReportFormPageComponent } from './features/dashboard/mentor/report-form-page.component';
import { MentorMessagesPageComponent } from './features/dashboard/mentor/messages-page.component';
import { MentorEarningsPageComponent } from './features/dashboard/mentor/earnings-page.component';
import { MentorReportsPageComponent } from './features/dashboard/mentor/reports-page.component';
import { MentorSettingsPageComponent } from './features/dashboard/mentor/settings-page.component';
import { MentorApplicationPendingComponent } from './features/dashboard/mentor/mentor-application-pending.component';
import { MentorApplicationRejectedComponent } from './features/dashboard/mentor/mentor-application-rejected.component';

// Admin dashboard pages
import { AdminUsersPageComponent } from './features/dashboard/admin/users-page.component';
import { AdminPaymentsPageComponent } from './features/dashboard/admin/payments-page.component';
import { AdminReportsPageComponent } from './features/dashboard/admin/reports-page.component';
import { AdminMentorshipReportsPageComponent } from './features/dashboard/admin/mentorship-reports-page.component';
import { AdminMentorApplicationsPageComponent } from './features/dashboard/admin/mentor-applications-page.component';
import { AdminMessagesPageComponent } from './features/dashboard/admin/messages-page.component';
import { AdminSettingsPageComponent } from './features/dashboard/admin/settings-page.component';

// Public pages
import { HowItWorksPageComponent } from './features/public/smart/how-it-works-page.component';
import { AboutPageComponent } from './features/public/smart/about-page.component';
import { TermsPageComponent } from './features/public/smart/terms-page.component';
import { PrivacyPageComponent } from './features/public/smart/privacy-page.component';
import { HelpPageComponent } from './features/public/smart/help-page.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: LandingPageComponent },
      { path: 'login', component: LoginPageComponent, canActivate: [guestGuard] },
      { path: 'signup', component: SignupPageComponent, canActivate: [guestGuard] },
      { path: 'forgot-password', component: ForgotPasswordPageComponent },
      { path: 'reset-password', component: ResetPasswordPageComponent },
      { path: 'verify-email', component: VerifyEmailPageComponent },
      { path: 'browse', component: BrowseMentorsPageComponent },
      {
        path: 'mentor/:id/request',
        component: MentorProfilePageComponent,
        canActivate: [authGuard, roleGuard(['mentee'])],
      },
      { path: 'mentor/:id/reviews', component: MentorReviewsPageComponent },
      { path: 'mentor/:id', component: MentorProfilePageComponent },
      { path: 'how-it-works', component: HowItWorksPageComponent },
      { path: 'about', component: AboutPageComponent },
      { path: 'help', component: HelpPageComponent },
      { path: 'terms', component: TermsPageComponent },
      { path: 'privacy', component: PrivacyPageComponent },
      { path: 'blog', redirectTo: 'about', pathMatch: 'full' },
    ],
  },
  {
    path: 'auth/registration-steps',
    component: RegistrationLayoutComponent,
    canActivate: [registrationGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'role-info' },
      { path: 'role-info', component: RoleInfoPageComponent },
      { path: 'personal-info', component: PersonalInfoPageComponent },
      { path: 'career-info', component: CareerInfoPageComponent },
      { path: 'biography', component: BiographyPageComponent },
      { path: 'preference', component: PreferencePageComponent },
      { path: 'preview', component: PreviewPageComponent },
    ],
  },
  {
    path: 'dashboard/mentee',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard(['mentee'])],
    children: [
      { path: '', pathMatch: 'full', component: MenteeDashboardComponent },
      { path: 'my-mentors', component: MyMentorsPageComponent },
      { path: 'messages', component: MenteeMessagesPageComponent },
      { path: 'payments', component: MenteePaymentsPageComponent },
      { path: 'reports', component: MenteeReportsPageComponent },
      { path: 'settings', component: MenteeSettingsPageComponent },
    ],
  },
  {
    path: 'dashboard/mentor',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard(['mentor']), mentorApprovalGuard],
    children: [
      { path: 'pending', component: MentorApplicationPendingComponent },
      { path: 'rejected', component: MentorApplicationRejectedComponent },
      { path: '', pathMatch: 'full', component: MentorDashboardComponent },
      { path: 'my-mentees', component: MyMenteesPageComponent },
      { path: 'report/:menteeId', component: MentorReportFormPageComponent },
      { path: 'messages', component: MentorMessagesPageComponent },
      { path: 'earnings', component: MentorEarningsPageComponent },
      { path: 'reports', component: MentorReportsPageComponent },
      { path: 'settings', component: MentorSettingsPageComponent },
    ],
  },
  {
    path: 'dashboard/admin',
    component: DashboardLayoutComponent,
    canActivate: [authGuard, roleGuard(['admin'])],
    children: [
      { path: '', pathMatch: 'full', component: AdminDashboardComponent },
      { path: 'mentor-applications', component: AdminMentorApplicationsPageComponent },
      { path: 'messages', component: AdminMessagesPageComponent },
      { path: 'users', component: AdminUsersPageComponent },
      { path: 'payments', component: AdminPaymentsPageComponent },
      { path: 'reports', component: AdminReportsPageComponent },
      { path: 'mentorship-reports', component: AdminMentorshipReportsPageComponent },
      { path: 'settings', component: AdminSettingsPageComponent },
    ],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
