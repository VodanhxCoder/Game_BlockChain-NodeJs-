// Provides profile, notification, and session security controls for the player.
import React, { useState } from "react";

export default function Settings() {
  const [toggles, setToggles] = useState({
    email: true,
    push: true,
    biometrics: false,
  });

  const flip = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="page-shell">
      <section className="page-hero fade-in-up">
        <span className="page-hero__badge">
          <span role="img" aria-hidden="true">
            ⚙️
          </span>
          Control Center
        </span>
        <h1 className="gradient-title">Tuỳ chỉnh trải nghiệm.</h1>
        <p className="page-hero__text">
          Đồng bộ ví, cập nhật hồ sơ và chọn thông báo mong muốn. Mọi thay đổi được ký và áp dụng ngay trên backend chuỗi.
        </p>
      </section>

      <section className="page-grid">
        <article className="settings-group">
          <h3>Hồ sơ</h3>
          <div className="settings-item">
            <div>
              <strong>Biệt danh</strong>
              <p>Hiển thị với toàn bộ người chơi</p>
            </div>
            <button type="button" className="ui-btn ui-btn--ghost">
              Chỉnh sửa
            </button>
          </div>
          <div className="settings-item">
            <div>
              <strong>Ví liên kết</strong>
              <p>0x7f...21A9 (MetaMask)</p>
            </div>
            <button type="button" className="ui-btn ui-btn--ghost">
              Đổi ví
            </button>
          </div>
          <div className="settings-item">
            <div>
              <strong>Xác thực 2 lớp</strong>
              <p>Bảo vệ ví và tài khoản đăng nhập</p>
            </div>
            <button type="button" className="ui-btn ui-btn--primary">
              Bật ngay
            </button>
          </div>
        </article>

        <article className="settings-group">
          <h3>Thông báo</h3>
          {["email", "push", "biometrics"].map((key) => (
            <div key={key} className="settings-item">
              <div>
                <strong>
                  {key === "email" && "Email rollout"}
                  {key === "push" && "Thông báo đẩy"}
                  {key === "biometrics" && "Xác nhận sinh trắc"}
                </strong>
                <p>
                  {key === "email" && "Nhận lịch sự kiện, update season."}
                  {key === "push" && "Cảnh báo khi có giao dịch và lời mời đấu."}
                  {key === "biometrics" && "Yêu cầu FaceID/TouchID khi giao dịch."}
                </p>
              </div>
              <button type="button" className="ui-switch" data-active={toggles[key]} onClick={() => flip(key)}>
                <span className="ui-switch__thumb" />
              </button>
            </div>
          ))}
        </article>
      </section>

      <section className="page-card">
        <h3>Bảo mật phiên</h3>
        <p className="page-hero__text">Theo dõi thiết bị đang hoạt động để đảm bảo không có đăng nhập lạ.</p>
        <div className="list-card" style={{ border: "none", boxShadow: "none" }}>
          <table>
            <thead>
              <tr>
                <th>Thiết bị</th>
                <th>Địa điểm</th>
                <th>Lần cuối</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Chrome · Windows</td>
                <td>Hanoi</td>
                <td>2 phút trước</td>
                <td>
                  <span className="chip chip--accent">Đang hoạt động</span>
                </td>
              </tr>
              <tr>
                <td>Safari · iOS</td>
                <td>Ho Chi Minh</td>
                <td>3 giờ trước</td>
                <td>
                  <button type="button" className="ui-btn ui-btn--text">
                    Ngắt kết nối
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
