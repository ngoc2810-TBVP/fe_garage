import React, { useEffect, useState } from "react";
import { Table, Button, Space, message, Popconfirm } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Services = () => {
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  // Lấy dữ liệu từ API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL_ADMIN}/services/get-all`
        );
        if (response.data.code === 200) {
          setServices(response.data.data);
        } else {
          message.error("Không thể tải danh sách dịch vụ");
        }
      } catch (error) {
        message.error("Lỗi khi tải danh sách dịch vụ");
      }
    };
    fetchServices();
  }, []);

  const handleView = (id) => {
    navigate(`/admin/services/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/admin/services/edit/${id}`);
  };

  const handleCreate = () => {
    navigate("/admin/services/create");
  };

  const handleDelete = async (id) => {
    try {
      const API = `${process.env.REACT_APP_API_URL_ADMIN}/services/delete/${id}`;
      const response = await axios.delete(API);
      if (response.data.code === 200) {
        message.success("Xóa dịch vụ thành công");
        setServices((prev) => prev.filter((service) => service._id !== id)); // Cập nhật danh sách sau khi xóa
      } else {
        message.error("Không thể xóa dịch vụ");
      }
    } catch (error) {
      message.error("Lỗi khi xóa dịch vụ");
    }
  };

  // Định nghĩa các cột của bảng
  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Tên dịch vụ",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price) => `${price.toLocaleString()} VNĐ`,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleView(record._id)}>
            Xem
          </Button>
          <Button type="link" onClick={() => handleEdit(record._id)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa dịch vụ này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Button
        type="primary"
        style={{ marginBottom: 16 }}
        onClick={handleCreate}
      >
        Thêm dịch vụ mới
      </Button>
      <Table
        columns={columns}
        dataSource={services}
        rowKey="id"
        bordered
        pagination={{ pageSize: 5 }}
      />
    </>
  );
};

export default Services;
