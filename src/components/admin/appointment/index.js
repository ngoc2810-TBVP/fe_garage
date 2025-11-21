import React, { useEffect, useState } from "react";
import { Table, Button, Space, message, Popconfirm } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Appointment = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerMap, setCustomerMap] = useState({});
  const [garageMap, setGarageMap] = useState({});
  const [serviceMap, setServiceMap] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8080/admin/appointments/get-all");

      if (!res.data || res.data.code !== 200) {
        message.error("Không thể tải dữ liệu cuộc hẹn");
        return;
      }

      const appointments = res.data.data || [];
      setData(appointments);

      // --- Lấy danh sách tất cả IDs ---
      const customerIds = [...new Set(appointments.map(i => i.customer_id).filter(Boolean))];
      const garageIds = [...new Set(appointments.map(i => i.garage_id).filter(Boolean))];

      // Xử lý service_id: mỗi appointment có thể nhiều dịch vụ
      let allServiceIds = [];
      appointments.forEach(a => {
        if (Array.isArray(a.service_id)) {
          allServiceIds.push(...a.service_id);
        } else if (a.service_id) {
          allServiceIds.push(a.service_id);
        }
      });
      const serviceIds = [...new Set(allServiceIds)];

      // --- Fetch dữ liệu theo ID ---
      const customerReq = customerIds.map(id =>
        axios.get(`http://localhost:8080/admin/customers/get-by-id/${id}`).catch(() => null)
      );
      const garageReq = garageIds.map(id =>
        axios.get(`http://localhost:8080/admin/garages/get-by-id/${id}`).catch(() => null)
      );
      const serviceReq = serviceIds.map(id =>
        axios.get(`http://localhost:8080/admin/services/get-by-id/${id}`).catch(() => null)
      );

      const [customers, garages, services] = await Promise.all([
        Promise.all(customerReq),
        Promise.all(garageReq),
        Promise.all(serviceReq),
      ]);

      // --- Mapping CUSTOMER ---
      const customerMapTemp = {};
      customers.forEach(r => {
        if (r && r.data && r.data.code === 200) {
          const c = r.data.data;
          if (c && c._id) customerMapTemp[c._id] = c.full_name || "Không tên";
        }
      });

      // --- Mapping GARAGE ---
      const garageMapTemp = {};
      garages.forEach(r => {
        if (r && r.data && r.data.code === 200) {
          const g = r.data.data;
          if (g && g._id) garageMapTemp[g._id] = g.name || "Không tên";
        }
      });

      // --- Mapping SERVICE ---
      const serviceMapTemp = {};
      services.forEach(r => {
        if (r && r.data && r.data.code === 200) {
          const s = r.data.data;
          if (s && s._id) serviceMapTemp[s._id] = s.name || "Không tên";
        }
      });

      setCustomerMap(customerMapTemp);
      setGarageMap(garageMapTemp);
      setServiceMap(serviceMapTemp);

    } catch (error) {
      console.log(error);
      message.error("Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id) => navigate(`/admin/appointments/${id}`);
  const handleCreate = () => navigate("/admin/appointments/create");
  const handleEdit = (id) => navigate(`/admin/appointments/edit/${id}`);

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`http://localhost:8080/admin/appointments/delete/${id}`);
      if (res.data.code === 200) {
        setData(prev => prev.filter(item => item._id !== id));
        message.success("Xóa cuộc hẹn thành công!");
      } else {
        message.error("Không thể xóa cuộc hẹn");
      }
    } catch (error) {
      message.error("Lỗi khi xóa cuộc hẹn");
    }
  };

  const columns = [
    {
      title: "STT",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Khách hàng",
      dataIndex: "customer_id",
      render: (id) => customerMap[id] || "Không xác định",
    },
    {
      title: "Garage",
      dataIndex: "garage_id",
      render: (id) => garageMap[id] || "Không xác định",
    },
    {
      title: "Dịch vụ",
      dataIndex: "service_id",
      render: (ids) => {
        if (!ids) return "";
        if (!Array.isArray(ids)) ids = [ids];
        return ids.map(id => serviceMap[id] || "Không xác định").join(", ");
      },
    },
    {
      title: "Ngày hẹn",
      dataIndex: "appointment_date",
      render: (date) => date ? new Date(date).toLocaleString() : "",
    },
    {
      title: "Ghi chú",
      dataIndex: "notes",
    },
    {
      title: "Hành động",
      render: (_, r) => (
        <Space>
          <Button type="link" onClick={() => handleView(r._id)}>Xem</Button>
          <Button type="link" onClick={() => handleEdit(r._id)}>Sửa</Button>
          <Popconfirm title="Xóa cuộc hẹn này?" onConfirm={() => handleDelete(r._id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button type="primary" onClick={handleCreate} style={{ marginBottom: 16 }}>
        Thêm mới
      </Button>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
        bordered
      />
    </>
  );
};

export default Appointment;
