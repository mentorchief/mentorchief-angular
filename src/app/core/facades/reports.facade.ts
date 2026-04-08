import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import type { MenteeReport } from '../models/dashboard.model';
import { ReportsActions } from '../../store/reports/reports.actions';
import {
  selectMenteeReports,
  selectMenteeReviews,
  selectMentorProfileReviews,
  selectReviewCountByMentorId,
} from '../../store/reports/reports.selectors';

@Injectable({ providedIn: 'root' })
export class ReportsFacade {
  private readonly store = inject(Store);

  readonly menteeReviews$ = this.store.select(selectMenteeReviews);
  readonly mentorProfileReviews$ = this.store.select(selectMentorProfileReviews);
  readonly menteeReports$ = this.store.select(selectMenteeReports);
  readonly reviewCountByMentorId$ = this.store.select(selectReviewCountByMentorId);

  submitMentorReview(mentorId: string, rating: number, comment: string): void {
    this.store.dispatch(ReportsActions.submitMentorReview({ mentorId, rating, comment }));
  }

  addMenteeReport(report: Omit<MenteeReport, 'id' | 'createdAt'>): void {
    this.store.dispatch(ReportsActions.addMenteeReport({ report }));
  }

  reviewMenteeReport(
    reportId: number,
    status: 'approved' | 'rejected',
    reviewerId: string,
    note?: string,
  ): void {
    this.store.dispatch(ReportsActions.reviewMenteeReport({ reportId, status, reviewerId, note }));
  }

  getReviewCountByMentorId(): Record<string, number> {
    let m: Record<string, number> = {};
    this.reviewCountByMentorId$.subscribe((x) => (m = x)).unsubscribe();
    return m;
  }

  getReportsForMentee(userId: string): MenteeReport[] {
    let list: MenteeReport[] = [];
    this.menteeReports$.subscribe((reports) => {
      list = reports.filter((r) => r.menteeId === userId);
    }).unsubscribe();
    return list;
  }

  getReportsForMentor(userId: string): MenteeReport[] {
    let list: MenteeReport[] = [];
    this.menteeReports$.subscribe((reports) => {
      list = reports.filter((r) => r.mentorId === userId);
    }).unsubscribe();
    return list;
  }

  getReportById(id: number): MenteeReport | null {
    let r: MenteeReport | null = null;
    this.menteeReports$.subscribe((reports) => {
      r = reports.find((x) => x.id === id) ?? null;
    }).unsubscribe();
    return r;
  }
}
