import React, { useEffect, useState } from "react";
import { Table, Button, Space, message, Popconfirm } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminIndex = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL_ADMIN}/get-all`
      );
      if (response.data.code === 200) {
        setData(response.data.data);
        message.success("Lấy danh sách Admin thành công!");
      } else {
        message.error("Không thể tải danh sách Admin.");
      }
    } catch (error) {
      message.error("Lỗi khi tải danh sách Admin.");
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleView = (id) => {
    navigate(`/admin/manage/${id}`);
  };

  const handleCreate = () => {
    navigate("/admin/manage/create");
  };

  const handleEdit = (id) => {
    navigate(`/admin/manage/edit/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const API = `${process.env.REACT_APP_API_URL_ADMIN}/delete/${id}`;
      const response = await axios.delete(API);
      if (response.data.code === 200) {
        message.success("Xóa Admin thành công.");
        setData((prev) => prev.filter((admin) => admin._id !== id));
      } else {
        message.error("Không thể xóa Admin.");
      }
    } catch (error) {
      message.error("Lỗi khi xóa Admin.");
    }
  };

  const columns = [
    {
      title: "STT",
      key: "index",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Ảnh",
      dataIndex: "thumbnail",
      key: "thumbnail",
      render: (thumbnail) => (
        <img
          src={thumbnail}
          alt="thumbnail"
          style={{ width: "100px", height: "auto", borderRadius: "8px" }}
        />
      )
    },    
    {
      title: "Tên người dùng",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Họ và tên",
      dataIndex: "full_name",
      key: "full_name",
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
            title="Bạn có chắc chắn muốn xóa Admin này?"
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
        Thêm Admin mới
      </Button>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{ pageSize: 5 }}
      />
    </>
  );
};

export default AdminIndex;
