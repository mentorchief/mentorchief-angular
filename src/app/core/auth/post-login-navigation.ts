import { Router } from '@angular/router';
import { MentorApprovalStatus, UserRole, type User } from '../models/user.model';
import { ROUTES } from '../routes';

export function getSafeMenteeReturnUrl(router: Router): string | null {
  const urlTree = router.parseUrl(router.url);
  const returnUrl = urlTree.queryParams['returnUrl'];
  if (typeof returnUrl !== 'string' || !returnUrl.startsWith('/mentor/') || returnUrl.includes('..')) {
    return null;
  }
  return returnUrl;
}

/** Navigate after email/password login or when user is already authenticated. */
export function navigateAfterAuthLogin(router: Router, user: User, returnUrl: string | null): void {
  if (user.role === UserRole.Admin) {
    void router.navigate([ROUTES.admin.dashboard]);
  } else if (user.role === UserRole.Mentor) {
    const status = user.mentorApprovalStatus ?? MentorApprovalStatus.Approved;
    if (status === MentorApprovalStatus.Pending) void router.navigate([ROUTES.mentor.pending]);
    else if (status === MentorApprovalStatus.Rejected) void router.navigate([ROUTES.mentor.rejected]);
    else void router.navigate([ROUTES.mentor.dashboard]);
  } else {
    if (returnUrl) void router.navigateByUrl(returnUrl);
    else void router.navigate([ROUTES.mentee.dashboard]);
  }
}

/** After signup when profile is complete or user skipped registration flow. */
export function navigateAfterSignupComplete(router: Router, user: User): void {
  navigateAfterAuthLogin(router, user, null);
}
