import React from 'react';
import type { User } from '../types';
import { FictionalBadge, Icon, Monogram } from './ui/Primitives';

const Profile: React.FC<{ user: User }> = ({ user }) => (
  <div className="dash-stack narrow-col">
    <section className="glass pad profile">
      <div className="profile-head">
        <Monogram name={user.name} size={72} tone="cobalt" />
        <div>
          <p className="h3">{user.name}</p>
          <FictionalBadge label="Fictional profile" />
        </div>
      </div>
      <dl className="fields">
        <div><dt>Name</dt><dd>{user.name}</dd></div>
        <div><dt>Email</dt><dd>{user.email}</dd></div>
        <div><dt>Role</dt><dd>{user.role}</dd></div>
        <div><dt>Account</dt><dd>Demonstration role, no authentication</dd></div>
      </dl>
      <div className="btn-row">
        <button type="button" className="btn btn-sm" disabled title="Not available in this demonstration">
          <Icon name="user" size={16} /> Edit profile
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled title="Not available in this demonstration">
          <Icon name="lock" size={16} /> Change password
        </button>
      </div>
      <p className="src">Editing and password changes are disabled: this demonstration has no accounts.</p>
    </section>
  </div>
);

export default Profile;
