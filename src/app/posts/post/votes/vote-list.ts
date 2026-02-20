import { ProfileItem } from '../../../profiles/profile-list/profile-item';
import { Component, inject, input, OnChanges } from '@angular/core';
import { Post, Vote } from '../../posts.types';
import { Profile } from '../../../app.types';
import { Votes, VoteType } from './votes';
import { List } from '../../../list';

@Component({
  selector: 'app-vote-list',
  imports: [ProfileItem, List],
  templateUrl: './vote-list.html',
  styles: ``,
})
export class VoteList implements OnChanges {
  protected readonly votes = inject(Votes);

  readonly postId = input.required<Post['id']>();
  readonly type = input<VoteType>('all');

  protected getVoteProfile(vote: Vote): Profile {
    return { ...vote.user.profile, user: vote.user };
  }

  ngOnChanges() {
    this.votes.config({ postId: this.postId(), type: this.type() });
    this.votes.load();
  }
}
