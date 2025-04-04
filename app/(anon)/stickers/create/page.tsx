"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import BottomSheet from "@/components/bottomSheet/BottomSheet";
import ItemBox from "@/components/itemBox/ItemBox";
import MainButton from "@/components/mainButton/MainButton";
import VerticalScrollContainer from "@/components/verticalScrollContainer/VerticalScrollContainer";
import styles from "./page.module.scss";
import Header from "@/components/header/Header";
import BackButton from "@/components/backButton/BackButton";
import { useRouter } from "next/navigation";
import { StickerStyleDto } from "@/application/usecases/stickerStyle/dto/StickerStyleDto";
import Rolly from "@/components/rolly/Rolly";
import useRollyStore from "@/application/state/useRollyStore";
import supabase from "@/utils/supabase/supabaseClient";
import Modal from "@/components/modal/Modal";
import useToggle from "@/hooks/useToggle";

import { PostitDto } from "@/application/usecases/postit/dto/PostitDto";
import { StickerDto } from "@/application/usecases/sticker/dto/StickerDto";

interface Sticker {
  id: string;
  name: string;
  sticker_style_id: number;
  x_position: number;
  y_position: number;
  rolly_id: number;
}

interface StickerStyle {
  id: number;
  name: string;
}

const Stickers: React.FC = () => {
  const router = useRouter();
  const [selectedStickers, setSelectedStickers] = useState<Sticker[]>([]);
  const [stickerStyleList, setStickerStyleList] = useState<StickerStyleDto[]>(
    []
  );

  const { id: rollyId, image, phrase, rollyTheme } = useRollyStore();
  const [postits, setPostits] = useState<PostitDto[]>([]);
  const [stickers, setStickers] = useState<StickerDto[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const draggableRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const handleMouseUp = useCallback(() => {
    if (isDragging) setIsDragging(false);
  }, [isDragging]);
  const handleMouseDown = useCallback(() => {}, []);
  const [isConfirmModalOpen, toggleConfirmModal] = useToggle(false);

  useEffect(() => {
    const fetchStickerStyles = async () => {
      const response = await fetch("/api/stickerstyles");
      const { success, data } = await response.json();
      if (success) {
        setStickerStyleList(data);
      }
    };

    fetchStickerStyles();
  }, []);

  useEffect(() => {
    const fetchPostits = async () => {
      const response = await fetch(`/api/postits?rollyId=${rollyId}`);
      const { success, postitsDto } = await response.json();
      if (success) {
        setPostits(postitsDto);
      }
    };

    const fetcStickers = async () => {
      const response = await fetch(`/api/stickers?rollyId=${rollyId}`);
      const { success, stickersDto } = await response.json();
      if (success) {
        setStickers(stickersDto);
      }
    };

    fetchPostits();
    fetcStickers();
  }, [rollyId]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [handleMouseUp, handleMouseDown]);

  const uploadStickers = async () => {
    console.log(selectedStickers);
    toggleConfirmModal();

    if (!fieldRef.current) {
      console.error("Container not found");
      return;
    }

    const containerWidth = fieldRef.current.clientWidth;

    // 각 스티커를 데이터베이스에 저장
    for (const sticker of selectedStickers) {
      const percentageX = (sticker.x_position / containerWidth) * 100;
      const percentageY = (sticker.y_position / containerWidth) * 100;

      const { data, error } = await supabase.from("sticker").insert([
        {
          sticker_style_id: sticker.sticker_style_id,
          x_position: percentageX,
          y_position: percentageY,
          rolly_id: rollyId,
        },
      ]);

      // 에러 처리
      if (error) {
        console.error("Error inserting sticker:", error);
        break; // 에러가 발생하면 반복 중단
      } else {
        console.log("Inserted sticker:", data);
      }
    }
    router.push(`/rollies/${rollyId}`);
  };

  const addSticker = (stickerStyle: StickerStyle) => {
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      name: stickerStyle.name,
      sticker_style_id: stickerStyle.id,
      x_position: 0, // 초기 위치는 기본값으로 설정
      y_position: 0,
      rolly_id: 0,
    };
    setSelectedStickers((prev) => [...prev, newSticker]);
    console.log(selectedStickers);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  // 드래그 중 위치 업데이트
  const handleDrag = (e: DraggableEvent, data: DraggableData, id: string) => {
    setSelectedStickers((prev) =>
      prev.map((sticker) =>
        sticker.id === id
          ? { ...sticker, x_position: data.x, y_position: data.y }
          : sticker
      )
    );
  };
  const handleDeleteSticker = (id: string) => {
    setSelectedStickers((prev) => prev.filter((sticker) => sticker.id !== id));
  };

  return (
    <div className={styles["stickersContainer"]}>
      <Header leftContent={<BackButton />} title="스티커" />
      <Rolly
        theme={rollyTheme}
        phrase={phrase}
        isEditable={false}
        imageUrl={image}
        postits={postits}
        stickers={stickers}
      >
        <div className={styles["sticker-field"]} ref={fieldRef}>
          {selectedStickers.map((sticker) => (
            <Draggable
              nodeRef={draggableRef as React.RefObject<HTMLElement>}
              key={sticker.id}
              position={{ x: sticker.x_position, y: sticker.y_position }}
              onStart={() => setIsDragging(true)}
              onDrag={(e, data) => handleDrag(e, data, sticker.id)}
              onStop={() => setIsDragging(false)}
              bounds={
                fieldRef.current
                  ? {
                      top: 0,
                      left: 0,
                      right: fieldRef.current.clientWidth - 60,
                      bottom: fieldRef.current.clientHeight - 55,
                    }
                  : undefined
              }
            >
              <div
                ref={draggableRef}
                onDragStart={handleDragStart}
                style={{
                  position: "absolute",
                }}
              >
                <Image
                  src={`/images/sticker/${sticker.name}.svg`}
                  // src={`/images/sticker/${sticker.src}`}
                  alt={`Sticker ${sticker.id}`}
                  width={40}
                  height={40}
                  style={{
                    cursor: "pointer",
                  }}
                />
                <button
                  className={styles["delete-button"]}
                  onClick={() => handleDeleteSticker(sticker.id)}
                >
                  X
                </button>
              </div>
            </Draggable>
          ))}
        </div>
      </Rolly>

      <BottomSheet>
        <VerticalScrollContainer>
          {stickerStyleList.map((stickerStyle, index) => (
            <ItemBox key={index} variant="image">
              <div onClick={() => addSticker(stickerStyle)}>
                <Image
                  src={`/images/sticker/${stickerStyle.name}.svg`}
                  alt={`Sticker ${stickerStyle.name}`}
                  width={44}
                  height={44}
                />
              </div>
            </ItemBox>
          ))}
        </VerticalScrollContainer>
        <MainButton text="완료" onClick={() => toggleConfirmModal()} />
      </BottomSheet>
      <Modal
        contents={[
          {
            title: "스티커를 저장하시겠어요?",
            body: "저장 후에는 스티커, 위치를 수정할 수 없어요!",
          },
        ]}
        isOpen={isConfirmModalOpen}
        onConfirm={uploadStickers}
        onCancel={() => toggleConfirmModal()}
      />
    </div>
  );
};

export default Stickers;
