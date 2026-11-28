import React, { useEffect, useState } from 'react';
import type { User } from '../types';
import { getAdminData } from '../services/mockApiService';
import type { AdminData } from '../services/mockApiService';
import { Skeleton } from './PatientDashboard';
import { FictionalBadge, Icon } from './ui/Primitives';

interface AdminDashboardProps {
  user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [data, setData] = useState<AdminData | null>(null);

  useEffect(() => {
    let live = true;
    getAdminData().then((d) => live && setData(d));
    return () => {
      live = false;
    };
  }, []);

  if (!data) return <Skeleton rows={4} />;
  const max = Math.max(...data.clinics.map((c) => c.patients));

  return (
    <div className="dash-stack">
      <div className="dash-banner">
        <FictionalBadge />
        <span>Clinics, patients, devices and revenue below are fictional. An admin role does not confer clinical authority.</span>
      </div>

      <section className="tiles" aria-label="Summary">
        <div className="glass tile"><Icon name="users" size={22} /><span className="eyebrow">Total patients</span><span className="num">{data.totalPatients.toLocaleString()}</span></div>
        <div className="glass tile"><Icon name="clinic" size={22} /><span className="eyebrow">Active clinics</span><span className="num">{data.clinics.length}</span></div>
        <div className="glass tile"><Icon name="wallet" size={22} /><span className="eyebrow">MRR (fictional)</span><span className="num c-fluor">${data.mrr.toLocaleString()}</span></div>
        <div className="glass tile"><Icon name="device" size={22} /><span className="eyebrow">Devices in service</span><span className="num">{data.devices.inService}</span></div>
      </section>

      <section className="grid-2 wide-left">
        <div className="glass pad">
          <span className="eyebrow">Clinic management</span>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Clinic</th><th>Patients</th><th>Plan</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {data.clinics.map((clinic) => (
                  <tr key={clinic.id}>
                    <td><b>{clinic.name}</b></td>
                    <td>
                      <span className="barcell">
                        <span className="bar" style={{ width: `${(clinic.patients / max) * 100}%` }} />
                        <span className="mono">{clinic.patients}</span>
                      </span>
                    </td>
                    <td><span className={`plan plan-${clinic.subscription.toLowerCase()}`}>{clinic.subscription}</span></td>
                    <td className="right">
                      <button type="button" className="link-btn" disabled title="Not available in this demonstration">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="glass pad service">
          <span className="eyebrow">Device service</span>
          <ul className="service-list">
            <li><span className="num">{data.devices.inService}</span><span>In service</span></li>
            <li><span className="num c-amber">{data.devices.calibrationDue}</span><span>Calibration due in 30 days</span></li>
            <li><span className="num c-alarm">{data.devices.quarantined}</span><span>Quarantined for cleaning or repair</span></li>
          </ul>
          <p className="src">Every released device should keep its build, calibration, inspection and service history. A device with expired calibration blocks reportable results.</p>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
